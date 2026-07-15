import {
  EMPTY,
  SPECIAL,
  assignmentToState,
  cloneState,
  collectViolations,
  filledCount,
  isValidSolution,
  cellId,
  nextForcedMove,
  parseStarSize,
  resolveBoard,
  starBoardToken,
  type Board,
  type Difficulty,
  type Rating,
  type State,
  type TierCounts,
} from "./engine.js";
import { entriesToAssignment, type GenRequest, type GenResponse } from "./engine.js";
import { pickDoodles } from "./doodles.js";
import { REALLY_MAX_SIZE, encodeParams, randomSeed, type PuzzleParams } from "./url.js";

type Status = "generating" | "playing" | "solved";

const TIER_LABEL: Record<number, string> = {
  1: "no-three (both pencils blocked here — must be the star)",
  2: "line counts (a pencil is used up, or only one spot fits the star)",
  3: "line enumeration (only one completion fits)",
  4: "what-if (every other option runs into a dead end)",
};

/**
 * Reactive game state (Svelte 5 runes). Owns the board, the active puzzle, the
 * player's working grid, undo/redo history and the timer. Heavy engine work
 * (generation) is delegated to a Web Worker.
 */
export class Game {
  // --- puzzle identity ---
  boardId = $state("s7");
  difficulty = $state<Difficulty>("normal");
  seed = $state(0);

  // --- immutable-per-puzzle data (raw: not deeply proxied) ---
  board = $state.raw<Board>(resolveBoard("s7"));
  solution = $state.raw<State>(new Int8Array(0));
  clueSet = $state.raw<Set<number>>(new Set());

  // --- mutable play state ---
  player = $state.raw<State>(new Int8Array(0));
  #undo = $state.raw<State[]>([]);
  #redo = $state.raw<State[]>([]);

  status = $state<Status>("generating");
  rating = $state<Rating | null>(null);
  counts = $state<TierCounts | null>(null);
  message = $state<string | null>(null);
  hintCell = $state<number | null>(null);
  elapsed = $state(0);
  /** Whether the solution is currently revealed (read-only overlay). */
  revealed = $state(false);
  /** Colour an empty cell takes on the first tap: 1 = black, 0 = white. */
  firstColor = $state<0 | 1>(loadFirstColor());
  /** Show the per-line star marks and the star counter. */
  showStarCounts = $state<boolean>(loadBool(SHOW_STARS_KEY, true));
  /** Highlight rule violations as they happen. */
  instantValidation = $state<boolean>(loadBool(VALIDATION_KEY, true));

  // --- derived ---
  /** The board's size (7|9|11|15). */
  starSize = $derived(parseStarSize(this.boardId));
  /** The game's tile artwork, picked deterministically from the seed. */
  doodles = $derived(pickDoodles(this.seed));
  violations = $derived(
    this.instantValidation
      ? collectViolations(this.player, this.board)
      : new Set<number>(),
  );
  solved = $derived(
    this.player.length > 0 && isValidSolution(this.player, this.board),
  );
  filled = $derived(filledCount(this.player));
  total = $derived(this.board.order.length);
  /** Stars the player (or clues) have placed so far. */
  starsPlaced = $derived.by(() => {
    let n = 0;
    for (const v of this.player) if (v === SPECIAL) n++;
    return n;
  });
  /** One star per row — the board's row count. */
  starsTotal = $derived(this.board.lines.length / 2);
  /** Stars currently placed per row-line, in top-to-bottom order. */
  rowStarCounts = $derived(this.#lineStarCounts("row"));
  /** Stars currently placed per column-line, in left-to-right order. */
  colStarCounts = $derived(this.#lineStarCounts("col"));

  #lineStarCounts(axis: "row" | "col"): number[] {
    return this.board.lines
      .filter((l) => l.axis === axis)
      .map((l) => l.cells.filter((ci) => this.player[ci] === SPECIAL).length);
  }
  canUndo = $derived(this.#undo.length > 0);
  canRedo = $derived(this.#redo.length > 0);

  // Cell indices per source block (recomputed only when the board changes).
  #blockCells = $derived(
    this.board.blocks.map((b) => {
      const idx: number[] = [];
      for (let r = b.rowStart; r <= b.rowEnd; r++) {
        for (let c = b.colStart; c <= b.colEnd; c++) {
          const i = this.board.cellIndex.get(cellId(r, c));
          if (i !== undefined) idx.push(i);
        }
      }
      return idx;
    }),
  );
  /** Per block: are all its cells filled and matching the solution? */
  blocksDone = $derived.by(() =>
    this.revealed
      ? this.board.blocks.map(() => true)
      : this.#blockCells.map((cells) =>
          cells.every((i) => this.player[i] !== EMPTY && this.player[i] === this.solution[i]),
        ),
  );

  #worker: Worker;
  #timer: ReturnType<typeof setInterval> | null = null;
  #startedAt = 0;

  constructor() {
    this.#worker = new Worker(
      new URL("./generate.worker.ts", import.meta.url),
      { type: "module" },
    );
    this.#worker.onmessage = (e: MessageEvent<GenResponse>) =>
      this.#onGenerated(e.data);
  }

  /** Start generating a puzzle for the given params (updates the URL hash). */
  generate(params: PuzzleParams): void {
    let board: Board;
    try {
      board = resolveBoard(params.board);
    } catch (err) {
      this.message = (err as Error).message;
      return;
    }
    this.boardId = params.board;
    this.board = board;
    this.difficulty = params.difficulty;
    this.seed = params.seed;
    this.status = "generating";
    this.message = null;
    this.hintCell = null;
    this.revealed = false;
    this.#stopTimer();
    this.elapsed = 0;
    location.hash = encodeParams(params);
    const req: GenRequest = {
      boardId: params.board,
      difficulty: params.difficulty,
      seed: params.seed,
    };
    this.#worker.postMessage(req);
  }

  /** New puzzle on the current board, fresh clues. */
  newPuzzle(difficulty: Difficulty = this.difficulty): void {
    this.generate({
      board: this.boardId,
      difficulty,
      seed: randomSeed(),
    });
  }

  /** Switch to a different board size, with a fresh puzzle. */
  setStarSize(size: number): void {
    this.generate({
      board: starBoardToken(size),
      // Big boards can't generate "Really?" within the time budget.
      difficulty:
        this.difficulty === "really" && size > REALLY_MAX_SIZE
          ? "hard"
          : this.difficulty,
      seed: randomSeed(),
    });
  }

  #onGenerated(res: GenResponse): void {
    const clues = entriesToAssignment(res.clues);
    this.solution = assignmentToState(this.board, entriesToAssignment(res.solution));
    this.player = assignmentToState(this.board, clues);
    this.clueSet = new Set(
      [...clues.keys()].map((id) => this.board.cellIndex.get(id)!),
    );
    this.#undo = [];
    this.#redo = [];
    this.rating = res.rating;
    this.counts = res.counts;
    this.status = "playing";
    this.message = null;
  }

  /**
   * Tap a cell: EMPTY -> first colour -> other colour -> star -> EMPTY. The
   * first colour is the configurable `firstColor` (default black). Clue cells
   * are locked, and taps are ignored while the solution is revealed.
   */
  cycle(idx: number): void {
    if (this.status !== "playing" || this.revealed || this.clueSet.has(idx)) return;
    const cur = this.player[idx]!;
    const other = (this.firstColor ^ 1) as 0 | 1;
    let next: number;
    if (cur === EMPTY) next = this.firstColor;
    else if (cur === this.firstColor) next = other;
    else if (cur === other) next = SPECIAL;
    else next = EMPTY;
    this.#commit(idx, next);
  }

  /**
   * Set a cell straight to the star, or clear it if it already holds one —
   * the long-press / right-click shortcut past the tap cycle.
   */
  toggleStar(idx: number): void {
    if (this.status !== "playing" || this.revealed || this.clueSet.has(idx)) return;
    this.#commit(idx, this.player[idx] === SPECIAL ? EMPTY : SPECIAL);
  }

  /** Toggle the read-only solution overlay. */
  toggleSolution(): void {
    if (this.status === "generating") return;
    this.revealed = !this.revealed;
    this.hintCell = null;
    this.message = this.revealed ? "Showing the solution (read-only)." : null;
  }

  /** Set the colour applied on the first tap; remembered across sessions. */
  setFirstColor(c: 0 | 1): void {
    this.firstColor = c;
    saveFirstColor(c);
  }

  setShowStarCounts(v: boolean): void {
    this.showStarCounts = v;
    saveBool(SHOW_STARS_KEY, v);
  }

  setInstantValidation(v: boolean): void {
    this.instantValidation = v;
    saveBool(VALIDATION_KEY, v);
  }

  #commit(idx: number, val: number): void {
    this.#undo = [...this.#undo, this.player];
    this.#redo = [];
    const next = cloneState(this.player);
    next[idx] = val;
    this.player = next;
    this.hintCell = null;
    this.message = null;
    this.#ensureTimer();
    if (this.solved) {
      this.status = "solved";
      this.#stopTimer();
    }
  }

  undo(): void {
    const prev = this.#undo.at(-1);
    if (prev === undefined) return;
    this.#redo = [...this.#redo, this.player];
    this.#undo = this.#undo.slice(0, -1);
    this.player = prev;
    this.status = "playing";
    this.hintCell = null;
  }

  redo(): void {
    const next = this.#redo.at(-1);
    if (next === undefined) return;
    this.#undo = [...this.#undo, this.player];
    this.#redo = this.#redo.slice(0, -1);
    this.player = next;
    if (this.solved) this.status = "solved";
  }

  /**
   * Hint: if the player has a cell contradicting the solution, flag it; else
   * reveal the next logically-forced cell and explain which tactic forces it.
   */
  hint(): void {
    if (this.status !== "playing" || this.revealed) return;

    // 1. Point out a mistake, if any.
    for (let i = 0; i < this.player.length; i++) {
      const v = this.player[i]!;
      if (v !== EMPTY && !this.clueSet.has(i) && v !== this.solution[i]) {
        this.hintCell = i;
        this.message = "That highlighted cell doesn't match the solution.";
        return;
      }
    }

    // 2. Reveal the next forced move.
    const move = nextForcedMove(this.player, this.board, 4);
    if (!move) {
      this.message = "No further move is forced by these tactics.";
      return;
    }
    this.#commit(move.cellIdx, move.val);
    this.hintCell = move.cellIdx;
    this.message = `Hint: ${TIER_LABEL[move.tier]}.`;
  }

  #ensureTimer(): void {
    if (this.#timer !== null) return;
    this.#startedAt = Date.now() - this.elapsed * 1000;
    this.#timer = setInterval(() => {
      this.elapsed = Math.floor((Date.now() - this.#startedAt) / 1000);
    }, 250);
  }

  #stopTimer(): void {
    if (this.#timer !== null) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }
}

const FIRST_COLOR_KEY = "unruly.firstColor";
const SHOW_STARS_KEY = "unruly.showStarCounts";
const VALIDATION_KEY = "unruly.instantValidation";

function loadFirstColor(): 0 | 1 {
  try {
    return localStorage.getItem(FIRST_COLOR_KEY) === "0" ? 0 : 1;
  } catch {
    return 1;
  }
}

function saveFirstColor(c: 0 | 1): void {
  try {
    localStorage.setItem(FIRST_COLOR_KEY, String(c));
  } catch {
    // ignore (e.g. storage disabled)
  }
}

function loadBool(key: string, dflt: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? dflt : raw === "1";
  } catch {
    return dflt;
  }
}

function saveBool(key: string, v: boolean): void {
  try {
    localStorage.setItem(key, v ? "1" : "0");
  } catch {
    // ignore (e.g. storage disabled)
  }
}
