import { assignmentToState, filledCount } from "./state.js";
import { tier1Moves, tier2Moves, tier3Moves, } from "./tactics.js";
const TACTICS = [
    tier1Moves,
    tier2Moves,
    tier3Moves,
];
/**
 * No-guessing logic solver (§4.4). Repeatedly applies the *lowest* tier (up to
 * `maxTier`) that yields at least one new move, to fixpoint. Records per-tier
 * invocation counts so difficulty can be measured (§4.5).
 */
export function logicSolve(clues, board, maxTier = 3) {
    const state = assignmentToState(board, clues);
    const counts = { tier1: 0, tier2: 0, tier3: 0 };
    let topTier = 0;
    for (;;) {
        let progressed = false;
        for (let tier = 1; tier <= maxTier; tier++) {
            const res = TACTICS[tier - 1](state, board);
            if (res.contradiction) {
                return { state, status: "contradiction", counts, topTier };
            }
            if (res.moves.size > 0) {
                for (const [idx, val] of res.moves)
                    state[idx] = val;
                counts[`tier${tier}`]++;
                topTier = Math.max(topTier, tier);
                progressed = true;
                break; // restart from the lowest tier
            }
        }
        if (!progressed)
            break;
    }
    const status = filledCount(state) === state.length ? "solved" : "stuck";
    return { state, status, counts, topTier };
}
/** Difficulty rating (§4.5): run the full tier set and map the highest used. */
export function rate(clues, board) {
    const { status, counts, topTier } = logicSolve(clues, board, 3);
    let rating;
    if (status !== "solved")
        rating = "unfair";
    else if (topTier >= 3)
        rating = "hard";
    else if (topTier === 2)
        rating = "medium";
    else
        rating = "easy"; // tier1-only (topTier 1, or 0 if clues already complete)
    return { rating, topTier, counts };
}
/** True if the clue set is fully solvable by deduction within `maxTier`. */
export function isFullySolved(clues, board, maxTier = 3) {
    return logicSolve(clues, board, maxTier).status === "solved";
}
/**
 * Find one forced move from the given partial `state` using the lowest tier that
 * fires (up to `maxTier`), without mutating `state`. Returns null if no tier
 * forces a move (stuck, solved, or contradictory). Powers the UI hint feature.
 */
export function nextForcedMove(state, board, maxTier = 3) {
    for (let tier = 1; tier <= maxTier; tier++) {
        const res = TACTICS[tier - 1](state, board);
        if (res.contradiction)
            return null;
        if (res.moves.size > 0) {
            const [cellIdx, val] = res.moves.entries().next().value;
            return { cellIdx, val, tier };
        }
    }
    return null;
}
//# sourceMappingURL=logic.js.map