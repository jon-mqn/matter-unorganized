import { buildBoard } from "./board.js";
/**
 * Allowed sizes for star boards: odd squares where every row/column holds
 * (n-1)/2 of each colour plus exactly one special.
 */
export const STAR_SIZES = [7, 9, 11, 15];
/**
 * Suggested generation effort for a board of `cellCount` cells, scaled so even
 * the largest allowed board finishes in a few seconds. More passes → fewer
 * clues (a better-minimised puzzle); fewer passes keeps big boards responsive.
 *
 * "Really?" is far more expensive per pass — every clue-removal check runs the
 * tier-4 solver, whose trials each cascade tiers 1-3 — so it gets sharply
 * fewer passes/attempts and leans on the time budget instead.
 */
export function generationBudget(cellCount, difficulty = "hard") {
    if (difficulty === "really") {
        if (cellCount <= 100)
            return { passes: 6, attempts: 12, timeBudgetMs: 7000 };
        if (cellCount <= 150)
            return { passes: 2, attempts: 6, timeBudgetMs: 7000 };
        return { passes: 1, attempts: 3, timeBudgetMs: 7000 };
    }
    if (cellCount <= 120)
        return { passes: 24, attempts: 40, timeBudgetMs: 6000 };
    if (cellCount <= 220)
        return { passes: 12, attempts: 20, timeBudgetMs: 6000 };
    // Large boards (s15): reducing is multi-second per pass and exact-band
    // matches are rare, so keep passes low and lean on the time budget.
    return { passes: 4, attempts: 8, timeBudgetMs: 7000 };
}
/** Star-board token for a size, e.g. 7 -> "s7". */
export function starBoardToken(size) {
    return `s${size}`;
}
/** Parse a star token ("s7") to its size, or null if not a valid star token. */
export function parseStarSize(token) {
    const m = /^s(\d+)$/.exec(token);
    if (!m)
        return null;
    const size = Number(m[1]);
    return STAR_SIZES.includes(size) ? size : null;
}
const boardCache = new Map();
/** Build (and cache) a single-square star board of the given size. */
export function buildStarBoard(size) {
    if (!STAR_SIZES.includes(size)) {
        throw new Error(`Star board size ${size} must be one of ${STAR_SIZES.join(", ")}.`);
    }
    const token = starBoardToken(size);
    let board = boardCache.get(token);
    if (!board) {
        board = buildBoard(token, [
            { rowStart: 1, rowEnd: size, colStart: 1, colEnd: size },
        ]);
        boardCache.set(token, board);
    }
    return board;
}
/** Resolve a board token to a Board (used by the CLI and web UI). */
export function resolveBoard(token) {
    const starSize = parseStarSize(token);
    if (starSize === null)
        throw new Error(`Invalid board "${token}".`);
    return buildStarBoard(starSize);
}
//# sourceMappingURL=boards.js.map