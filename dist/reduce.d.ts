import type { Assignment, Board, Rng, State } from "./types.js";
/** Uniqueness-minimal reduction: keep the puzzle's solution unique (§4.6). */
export declare function reduceUnique(solution: State, board: Board, rng: Rng, passes?: number): Assignment;
/**
 * Logic-aware reduction: keep the puzzle fully solvable by deduction within
 * `maxTier` (§4.6). Any logic-solvable puzzle is automatically unique.
 */
export declare function reduceLogic(solution: State, board: Board, rng: Rng, maxTier: number, passes?: number): Assignment;
