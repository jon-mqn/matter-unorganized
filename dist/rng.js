/**
 * Seedable RNG (mulberry32). Deterministic given a seed, so every randomised
 * step in the pipeline (fill, reduction order, multi-pass) is reproducible (§7).
 */
export function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** In-place Fisher–Yates shuffle using the supplied RNG. Returns the array. */
export function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}
/** Derive an independent seed for pass `n` from a base seed. */
export function deriveSeed(base, n) {
    // Mix with a large odd constant so successive passes are well-separated.
    return (Math.imul(base ^ (n + 1), 0x9e3779b1) >>> 0) ^ (n * 0x85ebca6b);
}
//# sourceMappingURL=rng.js.map