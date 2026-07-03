import type { Board, Difficulty, Puzzle, Rating, Rng } from "./types.js";
import { randomSolution } from "./solver.js";
import { reduceLogic } from "./reduce.js";
import { rate } from "./logic.js";
import { stateToAssignment } from "./state.js";

const MAX_TIER_FOR: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const RATING_RANK: Record<Rating, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  unfair: 100,
};

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
export function generate(
  board: Board,
  difficulty: Difficulty,
  rng: Rng,
  opts: GenerateOptions = {},
): Puzzle {
  const passes = opts.passes ?? 30;
  const attempts = opts.attempts ?? 40;
  const timeBudgetMs = opts.timeBudgetMs ?? Infinity;
  const maxTier = MAX_TIER_FOR[difficulty];
  const start = Date.now();

  let nearest: Puzzle | undefined;
  let nearestDist = Infinity;

  for (let a = 0; a < attempts; a++) {
    const solution = randomSolution(board, rng);
    const clues = reduceLogic(solution, board, rng, maxTier, passes);
    const { rating, counts } = rate(clues, board);
    const puzzle: Puzzle = {
      boardId: board.id,
      clues,
      solution: stateToAssignment(board, solution),
      rating,
      counts,
    };
    if (rating === difficulty) return puzzle;

    const dist = Math.abs(RATING_RANK[rating] - RATING_RANK[difficulty]);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = puzzle;
    }
    if (Date.now() - start >= timeBudgetMs) break;
  }

  if (nearest === undefined) {
    throw new Error(`Failed to generate a ${difficulty} puzzle.`);
  }
  return nearest;
}
