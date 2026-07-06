import type { Board, Colour, State } from "./types.js";
/**
 * Graded deduction tactics (§4.4), generalised to any number of cell states via
 * candidate elimination. Each scans the current partial `state` and returns the
 * set of newly-forced moves (cell order index -> colour), plus a contradiction
 * flag when the forced deductions are mutually or structurally inconsistent.
 * None of them guess.
 *
 * A cell's candidates are the colours not eliminated by:
 *   (a) no-three windows — placing the colour would complete an equal triple;
 *   (b) count caps — the colour already sits at its target on one of the
 *       cell's lines.
 * Tier 1 uses (a) only; tier 2 uses (a)+(b) plus the star hidden single. On
 * classic 2-colour boards this reproduces the original tiers exactly: a window
 * elimination leaves one candidate (the old [X,X,_] family), and a cap
 * elimination leaves one candidate (the old balance fill).
 */
export interface TacticResult {
    moves: Map<number, Colour>;
    contradiction: boolean;
}
/** Tier 1 — no-three forcing: window eliminations leaving a single candidate. */
export declare function tier1Moves(state: State, board: Board): TacticResult;
/**
 * Tier 2 — count forcing: window + cap eliminations leaving a single candidate
 * (on classic boards exactly the old balance fill), plus, on star boards, the
 * hidden single for the special: if only one cell of a line can still hold its
 * special, force it there.
 */
export declare function tier2Moves(state: State, board: Board): TacticResult;
/**
 * Tier 3 — line enumeration: enumerate every completion of a line consistent
 * with R1 ∧ R2 given knowns; force any cell constant across all completions.
 * Flags contradiction if any line has zero valid completions.
 */
export declare function tier3Moves(state: State, board: Board): TacticResult;
