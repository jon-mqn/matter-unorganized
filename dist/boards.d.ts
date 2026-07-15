import type { Board, Difficulty } from "./types.js";
/**
 * Allowed sizes for star boards: odd squares where every row/column holds
 * (n-1)/2 of each colour plus exactly one special.
 */
export declare const STAR_SIZES: readonly [7, 9, 11, 15];
/**
 * Suggested generation effort for a board of `cellCount` cells, scaled so even
 * the largest allowed board finishes in a few seconds. More passes → fewer
 * clues (a better-minimised puzzle); fewer passes keeps big boards responsive.
 *
 * "Really?" is far more expensive per pass — every clue-removal check runs the
 * tier-4 solver, whose trials each cascade tiers 1-3 — so it gets sharply
 * fewer passes/attempts and leans on the time budget instead.
 */
export declare function generationBudget(cellCount: number, difficulty?: Difficulty): {
    passes: number;
    attempts: number;
    timeBudgetMs: number;
};
/** Star-board token for a size, e.g. 7 -> "s7". */
export declare function starBoardToken(size: number): string;
/** Parse a star token ("s7") to its size, or null if not a valid star token. */
export declare function parseStarSize(token: string): number | null;
/** Build (and cache) a single-square star board of the given size. */
export declare function buildStarBoard(size: number): Board;
/** Resolve a board token to a Board (used by the CLI and web UI). */
export declare function resolveBoard(token: string): Board;
