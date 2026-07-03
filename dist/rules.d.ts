import type { Board, Line, State } from "./types.js";
/**
 * Line-evaluation primitives (§4.1). These are the only place the two rules are
 * encoded, and they are colour-count-agnostic via `k` so the k-colour hook of
 * §2.2 can be enabled later without touching the engine. Default k = 2.
 */
/** R1: does the line contain a completed triple of equal colour? */
export declare function lineViolatesNoThree(state: State, line: Line): boolean;
/** R2 feasibility: does any colour already exceed its cap of L/k on the line? */
export declare function lineCountExceedsCap(state: State, line: Line, k?: number): boolean;
/**
 * Partial-legality check (§4.1). Tentatively place `val` at `cellIdx` and, for
 * each line touching the cell, verify R2 feasibility (no colour exceeds L/k) and
 * R1 (no completed equal triple in a 3-window touching the cell). Restores the
 * state before returning. O(lines touching the cell), not O(board).
 */
export declare function legal(state: State, cellIdx: number, val: 0 | 1, board: Board, k?: number): boolean;
/** Full board validity for a total assignment (used by tests / §8.2). */
export declare function isValidSolution(state: State, board: Board, k?: number): boolean;
/**
 * Collect every cell index sitting on a line that currently breaks a rule:
 * a completed equal triple (R1) or a colour already exceeding its L/k cap (R2).
 * Intended for UI highlighting; reuses the line primitives above. A cell may be
 * reported via any of its lines.
 */
export declare function collectViolations(state: State, board: Board, k?: number): Set<number>;
