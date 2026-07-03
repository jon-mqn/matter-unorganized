import type { Board, Difficulty, Puzzle, Rng } from "./types.js";
export interface GenerateOptions {
    passes?: number;
    attempts?: number;
    /**
     * Wall-clock cap (ms). Retrying for an exact band match is multi-second on
     * large boards, so once this elapses `generate` stops and returns the
     * nearest-band candidate found so far. Checked between attempts.
     */
    timeBudgetMs?: number;
}
/**
 * End-to-end generation (§5): fill a random solution, reduce logic-aware to the
 * band's max tier, then confirm the rating lands exactly on the requested band;
 * retry from a fresh solution otherwise. Deterministic given `rng` (the time
 * budget only *shortens* the search, so it never changes which puzzle a given
 * seed yields before the budget is hit). If no attempt lands exactly on band,
 * returns the nearest-band candidate produced.
 */
export declare function generate(board: Board, difficulty: Difficulty, rng: Rng, opts?: GenerateOptions): Puzzle;
