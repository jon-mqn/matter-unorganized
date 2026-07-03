import type { Assignment, Board, Rng, State } from "./types.js";
/**
 * Count solutions consistent with `clues`, stopping early once `cap` are found
 * (§4.2). Use cap = 2 for uniqueness testing — we only need "exactly 1" vs "≥ 2".
 */
export declare function countSolutions(clues: Assignment, board: Board, cap?: number): number;
/**
 * Generate a random valid solution (§4.3): backtrack from an empty board with
 * the colour order randomised per cell. Returns the first completed fill.
 * Deterministic given `rng`.
 *
 * Unruly boards are loosely constrained, so a random fill normally succeeds
 * near-linearly — but naive sequential backtracking can occasionally fall into
 * a deep dead-end that takes many seconds to escape (seen on large boards). To
 * bound this, each attempt is capped at a fixed number of steps; if it exceeds
 * the cap it restarts from scratch (advancing `rng`, so still deterministic).
 * Restarts almost always converge immediately.
 */
export declare function randomSolution(board: Board, rng: Rng): State;
