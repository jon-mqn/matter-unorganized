import type {
  Assignment,
  Board,
  Colour,
  LogicResult,
  RateResult,
  Rating,
  State,
  TierCounts,
} from "./types.js";
import { EMPTY } from "./types.js";
import { assignmentToState, filledCount } from "./state.js";
import {
  type TacticResult,
  tier1Moves,
  tier2Moves,
  tier3Moves,
  tier4Moves,
} from "./tactics.js";

const TACTICS: ((state: Int8Array, board: Board) => TacticResult)[] = [
  tier1Moves,
  tier2Moves,
  tier3Moves,
  tier4Moves,
];

/**
 * No-guessing logic solver (§4.4). Repeatedly applies the *lowest* tier (up to
 * `maxTier`) that yields at least one new move, to fixpoint. Records per-tier
 * invocation counts so difficulty can be measured (§4.5).
 */
export function logicSolve(
  clues: Assignment,
  board: Board,
  maxTier = 4,
): LogicResult {
  const state = assignmentToState(board, clues);
  const counts: TierCounts = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };
  let topTier = 0;

  for (;;) {
    let progressed = false;
    for (let tier = 1; tier <= maxTier; tier++) {
      const res = TACTICS[tier - 1]!(state, board);
      if (res.contradiction) {
        return { state, status: "contradiction", counts, topTier };
      }
      if (res.moves.size > 0) {
        for (const [idx, val] of res.moves) state[idx] = val;
        counts[`tier${tier}` as keyof TierCounts]++;
        topTier = Math.max(topTier, tier);
        progressed = true;
        break; // restart from the lowest tier
      }
    }
    if (!progressed) break;
  }

  const status = filledCount(state) === state.length ? "solved" : "stuck";
  return { state, status, counts, topTier };
}

/** Difficulty rating (§4.5): run the full tier set and map the highest used. */
export function rate(clues: Assignment, board: Board): RateResult {
  const { status, counts, topTier } = logicSolve(clues, board, 4);
  let rating: Rating;
  if (status !== "solved") rating = "unfair";
  else if (topTier >= 4) rating = "really";
  else if (topTier === 3) rating = "hard";
  else rating = "normal"; // tiers 1-2 (star boards have no viable tier-1 band)
  return { rating, topTier, counts };
}

/** True if the clue set is fully solvable by deduction within `maxTier`. */
export function isFullySolved(
  clues: Assignment,
  board: Board,
  maxTier = 4,
): boolean {
  return logicSolve(clues, board, maxTier).status === "solved";
}

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
export function nextForcedMove(
  state: State,
  board: Board,
  maxTier = 4,
): ForcedMove | null {
  for (let tier = 1; tier <= maxTier; tier++) {
    const res = TACTICS[tier - 1]!(state, board);
    if (res.contradiction) return null;
    if (res.moves.size > 0) {
      const [cellIdx, val] = res.moves.entries().next().value!;
      return { cellIdx, val, tier };
    }
  }
  return null;
}
