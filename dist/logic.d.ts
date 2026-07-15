import type { Assignment, Board, Colour, LogicResult, RateResult, State } from "./types.js";
/**
 * No-guessing logic solver (§4.4). Repeatedly applies the *lowest* tier (up to
 * `maxTier`) that yields at least one new move, to fixpoint. Records per-tier
 * invocation counts so difficulty can be measured (§4.5).
 */
export declare function logicSolve(clues: Assignment, board: Board, maxTier?: number): LogicResult;
/** Difficulty rating (§4.5): run the full tier set and map the highest used. */
export declare function rate(clues: Assignment, board: Board): RateResult;
/** True if the clue set is fully solvable by deduction within `maxTier`. */
export declare function isFullySolved(clues: Assignment, board: Board, maxTier?: number): boolean;
export interface ForcedMove {
    cellIdx: number;
    val: Colour;
    /** The lowest tier (1-4) that forces this move — used to explain the hint. */
    tier: number;
}
/**
 * Find one forced move from the given partial `state` using the lowest tier that
 * fires (up to `maxTier`), without mutating `state`. Returns null if no tier
 * forces a move (stuck, solved, or contradictory). Powers the UI hint feature.
 */
export declare function nextForcedMove(state: State, board: Board, maxTier?: number): ForcedMove | null;
