import type { Board, State } from "./types.js";
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
/** Tier 1 — local no-three forcing within each line's 3-windows. */
export declare function tier1Moves(state: State, board: Board): TacticResult;
/** Tier 2 — balance fill: a line at L/2 of one colour forces the rest. */
export declare function tier2Moves(state: State, board: Board): TacticResult;
/**
 * Tier 3 — line enumeration: enumerate every completion of a line consistent
 * with R1 ∧ R2 given knowns; force any cell constant across all completions.
 * Flags contradiction if any line has zero valid completions.
 */
export declare function tier3Moves(state: State, board: Board): TacticResult;
