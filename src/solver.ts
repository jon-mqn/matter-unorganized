import type { Assignment, Board, Colour, Rng, State } from "./types.js";
import { EMPTY } from "./types.js";
import { legal } from "./rules.js";
import { shuffle } from "./rng.js";
import { assignmentToState, cloneState, emptyState } from "./state.js";

/**
 * Colour try-order for one cell of the random fill. The 2-colour path consumes
 * exactly one rng() call (a coin flip), byte-identical to the original binary
 * implementation, so classic seeds keep producing the same puzzles.
 */
function randomColourOrder(colours: number, rng: Rng): Colour[] {
  if (colours === 2) {
    const first = rng() < 0.5 ? 0 : 1;
    return [first as Colour, (first ^ 1) as Colour];
  }
  return shuffle(
    Array.from({ length: colours }, (_, c) => c as Colour),
    rng,
  );
}

/**
 * Count solutions consistent with `clues`, stopping early once `cap` are found
 * (§4.2). Use cap = 2 for uniqueness testing — we only need "exactly 1" vs "≥ 2".
 */
export function countSolutions(
  clues: Assignment,
  board: Board,
  cap = 2,
): number {
  const state = assignmentToState(board, clues);
  const order = board.order;
  let found = 0;

  const recurse = (i: number): void => {
    if (found >= cap) return;
    if (i === order.length) {
      found++;
      return;
    }
    if (state[i] !== EMPTY) {
      recurse(i + 1);
      return;
    }
    for (let v = 0; v < board.colours; v++) {
      const val = v as Colour;
      if (legal(state, i, val, board)) {
        state[i] = val;
        recurse(i + 1);
        state[i] = EMPTY;
        if (found >= cap) return;
      }
    }
  };

  recurse(0);
  return found;
}

/**
 * Generate a random valid solution (§4.3): backtrack from an empty board with
 * the colour order randomised per cell. Returns the first completed fill.
 * Deterministic given `rng`.
 *
 * Unruly boards are loosely constrained, so a random fill normally succeeds
 * near-linearly — but naive sequential backtracking can occasionally fall into
 * a deep dead-end that takes many seconds to escape (seen on large boards). To
 * bound this, each attempt is capped at a fixed number of steps; if it exceeds
 * the cap it restarts from scratch (advancing `rng`, so still deterministic).
 * Restarts almost always converge immediately.
 */
export function randomSolution(board: Board, rng: Rng): State {
  const order = board.order;
  const stepCap = 200 * order.length;
  const maxRestarts = 2000;

  for (let restart = 0; restart < maxRestarts; restart++) {
    const state = emptyState(board);
    let steps = 0;
    let aborted = false;

    const recurse = (i: number): boolean => {
      if (i === order.length) return true;
      if (++steps > stepCap) {
        aborted = true;
        return false;
      }
      for (const val of randomColourOrder(board.colours, rng)) {
        if (legal(state, i, val, board)) {
          state[i] = val;
          if (recurse(i + 1)) return true;
          state[i] = EMPTY;
          if (aborted) return false;
        }
      }
      return false;
    };

    if (recurse(0)) return cloneState(state);
    // Exhausted (unsatisfiable) or hit the step cap — restart with fresh RNG.
  }

  throw new Error(`Board "${board.id}" random fill did not converge.`);
}
