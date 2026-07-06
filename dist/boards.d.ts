import type { Board, BlockDef } from "./types.js";
/** Square-size constraints for custom Frankengrid boards. */
export declare const MIN_SIZE = 6;
export declare const MAX_SIZE = 14;
export declare const MAX_BLOCKS = 5;
/**
 * Allowed sizes for the star variant: odd squares where every row/column holds
 * (n-1)/2 of each colour plus exactly one special. Single square only (no
 * frankengrids) for v1.
 */
export declare const STAR_SIZES: readonly [7, 9, 11, 15];
/**
 * Cap on total cells (sum of size²). Generation cost grows ~quadratically with
 * cell count (the logic-aware reducer re-solves the board per candidate clue),
 * so this keeps the largest allowed board generating in a few seconds. Permits
 * e.g. 14-14 (392), 12-12-12 (432), 14-14-10 (496); rejects e.g. 14-14-14 (588).
 */
export declare const MAX_CELLS = 520;
/**
 * Reference board (§1.1): two 6×6 blocks offset by 3 columns.
 *   TOP    = rows 1-6,  cols 1-6
 *   BOTTOM = rows 7-12, cols 4-9
 * Yields 72 cells; spine cols 4-6 are length-12 lines, all others length 6.
 * This is exactly `stackedBlockDefs([6, 6])`.
 */
export declare const REFERENCE_BLOCKS: BlockDef[];
/** The reference board, built once and cached. */
export declare function referenceBoardBuild(): Board;
/** Validate a list of square sizes; throws with a clear message otherwise. */
export declare function validateSizes(sizes: number[]): void;
/**
 * Suggested generation effort for a board of `cellCount` cells, scaled so even
 * the largest allowed board finishes in a few seconds. More passes → fewer
 * clues (a better-minimised puzzle); fewer passes keeps big boards responsive.
 */
export declare function generationBudget(cellCount: number): {
    passes: number;
    attempts: number;
    timeBudgetMs: number;
};
/**
 * Arrange square blocks of the given `sizes` into a vertical Frankengrid: blocks
 * are stacked top-to-bottom (contiguous rows) and each is shifted right so it
 * overlaps the previous block's right half by `min(prev,cur)/2` columns (the
 * "spine"). Because every size is even and only *consecutive* blocks overlap,
 * every resulting line length is even (rows = a block's width; columns = one or
 * two stacked even heights), and no cell belongs to more than two blocks. The
 * longest line is the largest sum of two adjacent heights (≤ 28).
 *
 * `[6, 6]` reproduces the reference board.
 */
export declare function stackedBlockDefs(sizes: number[]): BlockDef[];
/** Canonical id / token for a stacked board, e.g. [6,6,8] -> "6-6-8". */
export declare function stackedBoardId(sizes: number[]): string;
/** Build (and cache) a vertical Frankengrid board from square sizes. */
export declare function buildStackedBoard(sizes: number[]): Board;
/**
 * Randomly arrange square blocks of the given `sizes` into a varied Frankengrid,
 * deterministic in `arrSeed`. Unlike the fixed vertical staircase, each block is
 * attached to a random earlier block in a random relationship — below, above,
 * beside (left/right), or truly overlapping — so shapes differ run to run.
 *
 * Every offset is *even*, which keeps all blocks' row-starts one parity and
 * col-starts one parity. That guarantees every maximal row/column run has even
 * length (each run begins on a start-parity cell and ends on an end-parity
 * cell), so any mix of stacking, side-by-side and overlap stays R2-legal.
 */
export declare function arrangeBlocks(sizes: number[], arrSeed: number): BlockDef[];
/** Star-board token for a size, e.g. 7 -> "s7". */
export declare function starBoardToken(size: number): string;
/** Parse a star token ("s7") to its size, or null if not a valid star token. */
export declare function parseStarSize(token: string): number | null;
/** Build (and cache) a single-square star board of the given size. */
export declare function buildStarBoard(size: number): Board;
/** Board token: sizes, optionally with an arrangement seed ("6-6-8~42"). */
export declare function boardToken(sizes: number[], arrSeed?: number): string;
/** Extract the arrangement seed from a token, or undefined for a canonical stack. */
export declare function parseArrSeed(token: string): number | undefined;
/**
 * Parse a board token's *sizes* ("reference", "6-6-8", or "6-6-8~42"), or null
 * if invalid. The arrangement seed (after "~") is read separately.
 */
export declare function parseBoardToken(token: string): number[] | null;
/** Resolve a board token to a Board (used by the CLI and web UI). */
export declare function resolveBoard(token: string): Board;
/** Registry of named boards for the CLI. */
export declare const BOARD_REGISTRY: Record<string, () => Board>;
