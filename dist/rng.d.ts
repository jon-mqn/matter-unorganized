import type { Rng } from "./types.js";
/**
 * Seedable RNG (mulberry32). Deterministic given a seed, so every randomised
 * step in the pipeline (fill, reduction order, multi-pass) is reproducible (§7).
 */
export declare function makeRng(seed: number): Rng;
/** In-place Fisher–Yates shuffle using the supplied RNG. Returns the array. */
export declare function shuffle<T>(arr: T[], rng: Rng): T[];
/** Derive an independent seed for pass `n` from a base seed. */
export declare function deriveSeed(base: number, n: number): number;
