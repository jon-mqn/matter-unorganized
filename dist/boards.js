import { buildBoard } from "./board.js";
import { makeRng } from "./rng.js";
/** Square-size constraints for custom Frankengrid boards. */
export const MIN_SIZE = 6;
export const MAX_SIZE = 14;
export const MAX_BLOCKS = 5;
/**
 * Allowed sizes for the star variant: odd squares where every row/column holds
 * (n-1)/2 of each colour plus exactly one special. Single square only (no
 * frankengrids) for v1.
 */
export const STAR_SIZES = [7, 9, 11, 15];
/**
 * Cap on total cells (sum of size²). Generation cost grows ~quadratically with
 * cell count (the logic-aware reducer re-solves the board per candidate clue),
 * so this keeps the largest allowed board generating in a few seconds. Permits
 * e.g. 14-14 (392), 12-12-12 (432), 14-14-10 (496); rejects e.g. 14-14-14 (588).
 */
export const MAX_CELLS = 520;
/**
 * Reference board (§1.1): two 6×6 blocks offset by 3 columns.
 *   TOP    = rows 1-6,  cols 1-6
 *   BOTTOM = rows 7-12, cols 4-9
 * Yields 72 cells; spine cols 4-6 are length-12 lines, all others length 6.
 * This is exactly `stackedBlockDefs([6, 6])`.
 */
export const REFERENCE_BLOCKS = [
    { rowStart: 1, rowEnd: 6, colStart: 1, colEnd: 6 },
    { rowStart: 7, rowEnd: 12, colStart: 4, colEnd: 9 },
];
let referenceBoard;
/** The reference board, built once and cached. */
export function referenceBoardBuild() {
    return (referenceBoard ??= buildBoard("reference", REFERENCE_BLOCKS));
}
/** Validate a list of square sizes; throws with a clear message otherwise. */
export function validateSizes(sizes) {
    if (sizes.length < 1) {
        throw new Error("A board needs at least one square.");
    }
    if (sizes.length > MAX_BLOCKS) {
        throw new Error(`A board may have at most ${MAX_BLOCKS} squares.`);
    }
    for (const s of sizes) {
        if (!Number.isInteger(s) || s % 2 !== 0) {
            throw new Error(`Square size ${s} must be an even integer.`);
        }
        if (s < MIN_SIZE || s > MAX_SIZE) {
            throw new Error(`Square size ${s} must be between ${MIN_SIZE} and ${MAX_SIZE}.`);
        }
    }
    const cells = sizes.reduce((n, s) => n + s * s, 0);
    if (cells > MAX_CELLS) {
        throw new Error(`Board is too large (${cells} cells; max ${MAX_CELLS}). Use fewer or smaller squares.`);
    }
}
/**
 * Suggested generation effort for a board of `cellCount` cells, scaled so even
 * the largest allowed board finishes in a few seconds. More passes → fewer
 * clues (a better-minimised puzzle); fewer passes keeps big boards responsive.
 */
export function generationBudget(cellCount) {
    if (cellCount <= 120)
        return { passes: 24, attempts: 40, timeBudgetMs: 6000 };
    if (cellCount <= 220)
        return { passes: 12, attempts: 20, timeBudgetMs: 6000 };
    if (cellCount <= 340)
        return { passes: 4, attempts: 8, timeBudgetMs: 7000 };
    // Large boards: reducing is multi-second per pass and exact-band matches are
    // rare, so keep passes low and lean on the time budget to return promptly.
    return { passes: 1, attempts: 6, timeBudgetMs: 7000 };
}
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
export function stackedBlockDefs(sizes) {
    validateSizes(sizes);
    const lefts = [];
    const tops = [];
    for (let i = 0; i < sizes.length; i++) {
        if (i === 0) {
            lefts.push(0);
            tops.push(0);
        }
        else {
            const overlap = Math.min(sizes[i - 1], sizes[i]) / 2;
            lefts.push(lefts[i - 1] + sizes[i - 1] - overlap);
            tops.push(tops[i - 1] + sizes[i - 1]); // contiguous vertical stack
        }
    }
    const minLeft = Math.min(...lefts);
    return sizes.map((s, i) => ({
        rowStart: tops[i] + 1,
        rowEnd: tops[i] + s,
        colStart: lefts[i] - minLeft + 1,
        colEnd: lefts[i] - minLeft + s,
    }));
}
/** Canonical id / token for a stacked board, e.g. [6,6,8] -> "6-6-8". */
export function stackedBoardId(sizes) {
    return sizes.join("-");
}
const stackedCache = new Map();
/** Build (and cache) a vertical Frankengrid board from square sizes. */
export function buildStackedBoard(sizes) {
    const id = stackedBoardId(sizes);
    let board = stackedCache.get(id);
    if (!board) {
        board = buildBoard(id, stackedBlockDefs(sizes));
        stackedCache.set(id, board);
    }
    return board;
}
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
export function arrangeBlocks(sizes, arrSeed) {
    validateSizes(sizes);
    const rng = makeRng(arrSeed >>> 0);
    const placed = [{ r: 0, c: 0, s: sizes[0] }];
    // Relationship generators. Each returns an even-offset candidate rect next to
    // the anchor, or null. Ranges guarantee ≥2 overlap along the shared axis.
    const rels = [
        (a, s) => rel(a, s, "below", rng),
        (a, s) => rel(a, s, "above", rng),
        (a, s) => rel(a, s, "right", rng),
        (a, s) => rel(a, s, "left", rng),
        (a, s) => rel(a, s, "overlap", rng),
    ];
    for (let i = 1; i < sizes.length; i++) {
        const s = sizes[i];
        let chosen = null;
        for (let attempt = 0; attempt < 400 && !chosen; attempt++) {
            const anchor = placed[Math.floor(rng() * placed.length)];
            const cand = rels[Math.floor(rng() * rels.length)](anchor, s);
            if (cand && addsCells(cand, placed) && couplesAny(cand, placed)) {
                chosen = cand;
            }
        }
        // Deterministic fallback: contiguous below block 0 (always valid).
        chosen ??= { r: placed[0].r + placed[0].s, c: placed[0].c, s };
        placed.push(chosen);
    }
    const minR = Math.min(...placed.map((p) => p.r));
    const minC = Math.min(...placed.map((p) => p.c));
    return placed.map((p) => ({
        rowStart: p.r - minR + 1,
        rowEnd: p.r - minR + p.s,
        colStart: p.c - minC + 1,
        colEnd: p.c - minC + p.s,
    }));
    function rel(a, s, kind, r) {
        switch (kind) {
            case "below": {
                const dc = evenBetween(-(s - 2), a.s - 2, r);
                return dc === null ? null : { r: a.r + a.s, c: a.c + dc, s };
            }
            case "above": {
                const dc = evenBetween(-(s - 2), a.s - 2, r);
                return dc === null ? null : { r: a.r - s, c: a.c + dc, s };
            }
            case "right": {
                const dr = evenBetween(-(s - 2), a.s - 2, r);
                return dr === null ? null : { r: a.r + dr, c: a.c + a.s, s };
            }
            case "left": {
                const dr = evenBetween(-(s - 2), a.s - 2, r);
                return dr === null ? null : { r: a.r + dr, c: a.c - s, s };
            }
            case "overlap": {
                const dr = evenBetween(-(s - 2), a.s - 2, r);
                const dc = evenBetween(-(s - 2), a.s - 2, r);
                return dr === null || dc === null ? null : { r: a.r + dr, c: a.c + dc, s };
            }
        }
    }
    // Does `cand` contribute at least one cell not already covered?
    function addsCells(cand, all) {
        for (let rr = cand.r; rr < cand.r + cand.s; rr++) {
            for (let cc = cand.c; cc < cand.c + cand.s; cc++) {
                if (!all.some((p) => rr >= p.r && rr < p.r + p.s && cc >= p.c && cc < p.c + p.s)) {
                    return true;
                }
            }
        }
        return false;
    }
    // Coupled = shares cells with, or is edge-adjacent (≥2 overlap) to, some block,
    // so a shared row/column line actually links them.
    function couplesAny(cand, all) {
        const span = (a1, a2, b1, b2) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1) + 1);
        return all.some((p) => {
            const ro = span(cand.r, cand.r + cand.s - 1, p.r, p.r + p.s - 1);
            const co = span(cand.c, cand.c + cand.s - 1, p.c, p.c + p.s - 1);
            if (ro > 0 && co > 0)
                return true; // overlap: shares cells
            const hAdj = (cand.c + cand.s === p.c || p.c + p.s === cand.c) && ro >= 2;
            const vAdj = (cand.r + cand.s === p.r || p.r + p.s === cand.r) && co >= 2;
            return hAdj || vAdj;
        });
    }
    function evenBetween(lo, hi, r) {
        const elo = lo % 2 === 0 ? lo : lo + 1;
        const ehi = hi % 2 === 0 ? hi : hi - 1;
        if (elo > ehi)
            return null;
        return elo + 2 * Math.floor(r() * ((ehi - elo) / 2 + 1));
    }
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
/** Build (and cache) a single-square star board of the given size. */
export function buildStarBoard(size) {
    if (!STAR_SIZES.includes(size)) {
        throw new Error(`Star board size ${size} must be one of ${STAR_SIZES.join(", ")}.`);
    }
    const token = starBoardToken(size);
    let board = stackedCache.get(token);
    if (!board) {
        board = buildBoard(token, [{ rowStart: 1, rowEnd: size, colStart: 1, colEnd: size }], "star");
        stackedCache.set(token, board);
    }
    return board;
}
/** Board token: sizes, optionally with an arrangement seed ("6-6-8~42"). */
export function boardToken(sizes, arrSeed) {
    const base = sizes.join("-");
    return arrSeed === undefined ? base : `${base}~${arrSeed >>> 0}`;
}
/** Extract the arrangement seed from a token, or undefined for a canonical stack. */
export function parseArrSeed(token) {
    const i = token.indexOf("~");
    if (i < 0)
        return undefined;
    const n = Number(token.slice(i + 1));
    return Number.isInteger(n) && n >= 0 ? n >>> 0 : undefined;
}
/**
 * Parse a board token's *sizes* ("reference", "6-6-8", or "6-6-8~42"), or null
 * if invalid. The arrangement seed (after "~") is read separately.
 */
export function parseBoardToken(token) {
    const base = token.split("~")[0];
    if (base === "reference")
        return [6, 6];
    const sizes = base.split("-").map((p) => Number(p));
    if (sizes.some((n) => !Number.isInteger(n)))
        return null;
    try {
        validateSizes(sizes);
    }
    catch {
        return null;
    }
    return sizes;
}
/** Resolve a board token to a Board (used by the CLI and web UI). */
export function resolveBoard(token) {
    const starSize = parseStarSize(token);
    if (starSize !== null)
        return buildStarBoard(starSize);
    const sizes = parseBoardToken(token);
    if (!sizes)
        throw new Error(`Invalid board "${token}".`);
    const arrSeed = parseArrSeed(token);
    let board = stackedCache.get(token);
    if (!board) {
        const defs = arrSeed === undefined ? stackedBlockDefs(sizes) : arrangeBlocks(sizes, arrSeed);
        board = buildBoard(token, defs);
        stackedCache.set(token, board);
    }
    return board;
}
/** Registry of named boards for the CLI. */
export const BOARD_REGISTRY = {
    reference: referenceBoardBuild,
};
//# sourceMappingURL=boards.js.map