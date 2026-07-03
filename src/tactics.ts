import type { Board, Line, State } from "./types.js";
import { EMPTY } from "./types.js";

/**
 * Graded deduction tactics (§4.4). Each scans the current partial `state` and
 * returns the set of newly-forced moves (cell order index -> colour), plus a
 * contradiction flag when the forced deductions are mutually or structurally
 * inconsistent. None of them guess.
 */
export interface TacticResult {
  moves: Map<number, 0 | 1>;
  contradiction: boolean;
}

/** Record a forced move, flagging contradictions against knowns / prior moves. */
function addMove(
  res: TacticResult,
  state: State,
  idx: number,
  val: 0 | 1,
): void {
  const known = state[idx]!;
  if (known !== EMPTY) {
    if (known !== val) res.contradiction = true;
    return; // already satisfied
  }
  const pending = res.moves.get(idx);
  if (pending !== undefined) {
    if (pending !== val) res.contradiction = true;
    return;
  }
  res.moves.set(idx, val);
}

/** Tier 1 — local no-three forcing within each line's 3-windows. */
export function tier1Moves(state: State, board: Board): TacticResult {
  const res: TacticResult = { moves: new Map(), contradiction: false };
  for (const line of board.lines) {
    const cells = line.cells;
    for (let i = 0; i + 2 < cells.length; i++) {
      const a = state[cells[i]!]!;
      const b = state[cells[i + 1]!]!;
      const c = state[cells[i + 2]!]!;
      // [X, X, _] -> pos i+2 = ¬X
      if (a !== EMPTY && a === b && c === EMPTY) {
        addMove(res, state, cells[i + 2]!, (a ^ 1) as 0 | 1);
      }
      // [_, X, X] -> pos i = ¬X
      if (b !== EMPTY && b === c && a === EMPTY) {
        addMove(res, state, cells[i]!, (b ^ 1) as 0 | 1);
      }
      // [X, _, X] -> pos i+1 = ¬X
      if (a !== EMPTY && a === c && b === EMPTY) {
        addMove(res, state, cells[i + 1]!, (a ^ 1) as 0 | 1);
      }
    }
  }
  return res;
}

/** Tier 2 — balance fill: a line at L/2 of one colour forces the rest. */
export function tier2Moves(state: State, board: Board): TacticResult {
  const res: TacticResult = { moves: new Map(), contradiction: false };
  for (const line of board.lines) {
    const cap = line.length / 2;
    let ones = 0;
    let zeros = 0;
    let empties = 0;
    for (const ci of line.cells) {
      const v = state[ci]!;
      if (v === 1) ones++;
      else if (v === 0) zeros++;
      else empties++;
    }
    if (empties === 0) continue;
    if (ones === cap && zeros < cap) {
      for (const ci of line.cells) {
        if (state[ci] === EMPTY) addMove(res, state, ci, 0);
      }
    } else if (zeros === cap && ones < cap) {
      for (const ci of line.cells) {
        if (state[ci] === EMPTY) addMove(res, state, ci, 1);
      }
    }
  }
  return res;
}

/**
 * Tier 3 — line enumeration: enumerate every completion of a line consistent
 * with R1 ∧ R2 given knowns; force any cell constant across all completions.
 * Flags contradiction if any line has zero valid completions.
 */
export function tier3Moves(state: State, board: Board): TacticResult {
  const res: TacticResult = { moves: new Map(), contradiction: false };
  for (const line of board.lines) {
    const empties: number[] = [];
    for (const ci of line.cells) if (state[ci] === EMPTY) empties.push(ci);
    if (empties.length === 0) continue;

    const forced = lineForcedMoves(state, line);
    if (forced === null) {
      res.contradiction = true;
      return res;
    }
    for (const [idx, val] of forced) addMove(res, state, idx, val);
  }
  return res;
}

/**
 * For a line, compute which empty cells take the same value across every
 * R1∧R2-valid completion, and force them. Returns null if the line has no valid
 * completion (contradiction).
 *
 * Implemented as an O(L²) DP over line completions rather than enumerating all
 * 2^empties masks, so it stays fast on long spines (a stacked pair of size-14
 * blocks yields length-28 lines). State = (ones placed so far, last colour, run
 * length 1|2). Forward reachability F and backward completability G are combined
 * to find, per cell, which colours appear in some full valid completion; a cell
 * with exactly one possible colour is forced. This is the memoised line
 * enumeration anticipated by the spec (§10).
 */
function lineForcedMoves(state: State, line: Line): Map<number, 0 | 1> | null {
  const cells = line.cells;
  const L = line.length;
  const target = L / 2; // required count of each colour (R2)
  const fixed = cells.map((ci) => state[ci]!);

  // State encoding: ones in [0,target], colour in {0,1,2=none}, run in {0,1,2}.
  const size = (target + 1) * 9;
  const enc = (ones: number, colour: number, run: number) =>
    ones * 9 + colour * 3 + run;
  const START = enc(0, 2, 0);

  // Every valid transition from a state by placing colour `c` at position `i`.
  // Returns the successor state id, or -1 if the placement is illegal.
  const step = (id: number, c: number, i: number): number => {
    if (fixed[i] !== EMPTY && fixed[i] !== c) return -1;
    const ones = Math.floor(id / 9);
    const colour = Math.floor((id % 9) / 3);
    const run = id % 3;
    let nrun: number;
    if (colour === c) {
      nrun = run + 1;
      if (nrun > 2) return -1; // R1: no three in a row
    } else {
      nrun = 1;
    }
    const nones = ones + c; // c is 0 or 1
    if (nones > target) return -1; // R2: too many of this colour
    if (i + 1 - nones > target) return -1; // R2: too many of the other colour
    return enc(nones, c, nrun);
  };

  // Forward: F[i] = states reachable after filling positions 0..i-1.
  const F: Uint8Array[] = Array.from({ length: L + 1 }, () => new Uint8Array(size));
  F[0]![START] = 1;
  for (let i = 0; i < L; i++) {
    const Fi = F[i]!;
    const Fn = F[i + 1]!;
    for (let id = 0; id < size; id++) {
      if (!Fi[id]) continue;
      for (let c = 0; c < 2; c++) {
        const ns = step(id, c, i);
        if (ns >= 0) Fn[ns] = 1;
      }
    }
  }

  // Backward: G[i] = states at boundary i that can complete to a valid line.
  const G: Uint8Array[] = Array.from({ length: L + 1 }, () => new Uint8Array(size));
  for (let id = 0; id < size; id++) {
    if (Math.floor(id / 9) === target) G[L]![id] = 1; // accept: exactly target ones
  }
  for (let i = L - 1; i >= 0; i--) {
    const Gi = G[i]!;
    const Gn = G[i + 1]!;
    for (let id = 0; id < size; id++) {
      for (let c = 0; c < 2; c++) {
        const ns = step(id, c, i);
        if (ns >= 0 && Gn[ns]) {
          Gi[id] = 1;
          break;
        }
      }
    }
  }

  if (!G[0]![START]) return null; // no valid completion at all

  const forced = new Map<number, 0 | 1>();
  for (let i = 0; i < L; i++) {
    if (fixed[i] !== EMPTY) continue;
    const Fi = F[i]!;
    const Gn = G[i + 1]!;
    let allow0 = false;
    let allow1 = false;
    for (let id = 0; id < size && !(allow0 && allow1); id++) {
      if (!Fi[id]) continue;
      for (let c = 0; c < 2; c++) {
        const ns = step(id, c, i);
        if (ns >= 0 && Gn[ns]) {
          if (c === 0) allow0 = true;
          else allow1 = true;
        }
      }
    }
    if (allow0 !== allow1) forced.set(cells[i]!, allow1 ? 1 : 0);
  }
  return forced;
}
