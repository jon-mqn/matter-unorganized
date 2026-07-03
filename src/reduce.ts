import type { Assignment, Board, Rng, State } from "./types.js";
import { makeRng, shuffle } from "./rng.js";
import { stateToAssignment } from "./state.js";
import { countSolutions } from "./solver.js";
import { isFullySolved } from "./logic.js";

/**
 * Clue reducer (§4.6). Both modes start from a full valid solution and remove
 * givens one at a time in randomised order, keeping a removal only if a mode
 * predicate still holds. Greedy single passes are jumpy, so we run N seeded
 * passes and keep the fewest-clue result (§7).
 */

const DEFAULT_PASSES = 30;

/** One greedy removal pass. `keep(clues)` decides if a removal is allowed. */
function reduceOnce(
  solution: State,
  board: Board,
  rng: Rng,
  keep: (clues: Assignment) => boolean,
): Assignment {
  const clues = stateToAssignment(board, solution);
  const ids = shuffle([...clues.keys()], rng);
  for (const id of ids) {
    const val = clues.get(id)!;
    clues.delete(id);
    if (!keep(clues)) clues.set(id, val); // removal broke the invariant; restore
  }
  return clues;
}

/** Run `run` over N passes with independent derived RNGs; keep fewest clues. */
function multiPass(
  passes: number,
  rng: Rng,
  run: (r: Rng) => Assignment,
): Assignment {
  let best: Assignment | undefined;
  for (let p = 0; p < passes; p++) {
    const sub = makeRng(Math.floor(rng() * 0x100000000));
    const clues = run(sub);
    if (best === undefined || clues.size < best.size) best = clues;
  }
  return best!;
}

/** Uniqueness-minimal reduction: keep the puzzle's solution unique (§4.6). */
export function reduceUnique(
  solution: State,
  board: Board,
  rng: Rng,
  passes = DEFAULT_PASSES,
): Assignment {
  return multiPass(passes, rng, (r) =>
    reduceOnce(solution, board, r, (clues) => countSolutions(clues, board, 2) === 1),
  );
}

/**
 * Logic-aware reduction: keep the puzzle fully solvable by deduction within
 * `maxTier` (§4.6). Any logic-solvable puzzle is automatically unique.
 */
export function reduceLogic(
  solution: State,
  board: Board,
  rng: Rng,
  maxTier: number,
  passes = DEFAULT_PASSES,
): Assignment {
  return multiPass(passes, rng, (r) =>
    reduceOnce(solution, board, r, (clues) =>
      isFullySolved(clues, board, maxTier),
    ),
  );
}
