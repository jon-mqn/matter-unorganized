import type { Assignment, Board, Rng, State } from "./types.js";
/**
 * Count solutions consistent with `clues`, stopping early once `cap` are found
 * (§4.2). Use cap = 2 for uniqueness testing — we only need "exactly 1" vs "≥ 2".
 */
export declare function countSolutions(clues: Assignment, board: Board, cap?: number): number;
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
export declare function randomSolution(board: Board, rng: Rng): State;
