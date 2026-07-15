import type { Assignment, Board, Colour, Rng, State } from "./types.js";
import { EMPTY, SPECIAL } from "./types.js";
import { legal } from "./rules.js";
import { shuffle } from "./rng.js";
import { assignmentToState, cloneState, emptyState } from "./state.js";

/** Coin-flip try-order over the two pencil colours for one cell of the fill. */
function randomColourOrder(rng: Rng): Colour[] {
  const first = rng() < 0.5 ? 0 : 1;
  return [first as Colour, (first ^ 1) as Colour];
}

/**
 * Pre-place one star per row at a uniformly random column permutation. A
 * permutation puts exactly one star in every row and column, so every star
 * target is satisfied by construction — no legality check needed.
 */
function placeStars(state: State, board: Board, rng: Rng): void {
  const rows = board.lines.filter((l) => l.axis === "row");
  const perm = shuffle(
    Array.from({ length: rows.length }, (_, i) => i),
    rng,
  );
  rows.forEach((line, r) => {
    state[line.cells[perm[r]!]!] = SPECIAL;
  });
}

/**
 * Count solutions consistent with `clues`, stopping early once `cap` are found
 * (§4.2). Use cap = 2 for uniqueness testing — we only need "exactly 1" vs "≥ 2".
 */
export function countSolutions(
  clues: Assignment,
  board: Board,
  cap = 2,
): number {
  const state = assignmentToState(board, clues);
  const order = board.order;
  let found = 0;

  const recurse = (i: number): void => {
    if (found >= cap) return;
    if (i === order.length) {
      found++;
      return;
    }
    if (state[i] !== EMPTY) {
      recurse(i + 1);
      return;
    }
    for (let v = 0; v < board.colours; v++) {
      const val = v as Colour;
      if (legal(state, i, val, board)) {
        state[i] = val;
        recurse(i + 1);
        state[i] = EMPTY;
        if (found >= cap) return;
      }
    }
  };

  recurse(0);
  return found;
}

/**
 * Generate a random valid solution (§4.3): place the stars as an explicitly
 * uniform permutation, then backtrack-fill the two colours with the try-order
 * randomised per cell. Deterministic given `rng`.
 *
 * The stars must NOT be left to the backtracker: a depth-first fill returns
 * the first completion it finds, which lands each row's star on the earliest
 * still-free column — piling stars onto the main diagonal. Sampling the
 * permutation up front makes every star arrangement equally likely.
 *
 * Star boards are loosely constrained, so the colour fill normally succeeds
 * near-linearly — but naive sequential backtracking can occasionally fall into
 * a deep dead-end that takes many seconds to escape (seen on large boards). To
 * bound this, each attempt is capped at a fixed number of steps; if it exceeds
 * the cap (or the permutation admits no balanced completion) it restarts from
 * scratch with a fresh permutation (advancing `rng`, so still deterministic).
 * Restarts almost always converge immediately.
 */
export function randomSolution(board: Board, rng: Rng): State {
  const order = board.order;
  const stepCap = 200 * order.length;
  const maxRestarts = 2000;

  for (let restart = 0; restart < maxRestarts; restart++) {
    const state = emptyState(board);
    placeStars(state, board, rng);
    let steps = 0;
    let aborted = false;

    const recurse = (i: number): boolean => {
      if (i === order.length) return true;
      if (state[i] !== EMPTY) return recurse(i + 1);
      if (++steps > stepCap) {
        aborted = true;
        return false;
      }
      for (const val of randomColourOrder(rng)) {
        if (legal(state, i, val, board)) {
          state[i] = val;
          if (recurse(i + 1)) return true;
          state[i] = EMPTY;
          if (aborted) return false;
        }
      }
      return false;
    };

    if (recurse(0)) return cloneState(state);
    // Exhausted (unsatisfiable) or hit the step cap — restart with fresh RNG.
  }

  throw new Error(`Board "${board.id}" random fill did not converge.`);
}
