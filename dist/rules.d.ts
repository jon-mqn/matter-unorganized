import type { Board, Colour, Line, State } from "./types.js";
/**
 * Line-evaluation primitives (§4.1). These are the only place the two rules are
 * encoded. R2 is generalised to a per-line target count per colour
 * (`line.targets`): classic boards use [L/2, L/2]; star boards use
 * [(L-1)/2, (L-1)/2, 1]. R1 (no-three) compares raw values, so it applies to
 * any number of cell states unchanged.
 */
/** R1: does the line contain a completed triple of equal colour? */
export declare function lineViolatesNoThree(state: State, line: Line): boolean;
/** Count of each colour currently placed on the line. */
export declare function lineColourCounts(state: State, line: Line, colours: number): number[];
/** R2 feasibility: does any colour already exceed its target on the line? */
export declare function lineCountExceedsCap(state: State, line: Line, colours?: number): boolean;
/**
 * Partial-legality check (§4.1). Tentatively place `val` at `cellIdx` and, for
 * each line touching the cell, verify R2 feasibility (no colour exceeds its
 * target) and R1 (no completed equal triple in a 3-window touching the cell).
 * Restores the state before returning. O(lines touching the cell), not O(board).
 */
export declare function legal(state: State, cellIdx: number, val: Colour, board: Board): boolean;
/** Full board validity for a total assignment (used by tests / §8.2). */
export declare function isValidSolution(state: State, board: Board): boolean;
/**
 * Collect every cell index sitting on a line that currently breaks a rule:
 * a completed equal triple (R1) or a colour already exceeding its target (R2).
 * Intended for UI highlighting; reuses the line primitives above. A cell may be
 * reported via any of its lines.
 */
export declare function collectViolations(state: State, board: Board): Set<number>;
