import { describe, expect, it } from "vitest";
import { buildStarBoard } from "../src/boards.js";
import { generate } from "../src/generate.js";
import { logicSolve, rate } from "../src/logic.js";
import { makeRng } from "../src/rng.js";
import { assignmentToState } from "../src/state.js";

// A deterministic hard s7 puzzle straight from the shipped pipeline: the seed
// is fixed, so the same clue set and solution come back every run.
const board = buildStarBoard(7);
const puzzle = generate(board, "hard", makeRng(3), { passes: 8, attempts: 10 });

describe("logic solver soundness (§8.4)", () => {
  it("every move agrees with the seed solution", () => {
    const { state, status } = logicSolve(puzzle.clues, board, 3);
    expect(status).toBe("solved");
    const solutionState = assignmentToState(board, puzzle.solution);
    for (let i = 0; i < state.length; i++) {
      expect(state[i]).toBe(solutionState[i]);
    }
  });
});

describe("logic solver completeness band (§8.5)", () => {
  it("rates the generated hard puzzle Hard with Tier-3 used", () => {
    const { rating, counts } = rate(puzzle.clues, board);
    expect(rating).toBe("hard");
    expect(counts.tier3).toBeGreaterThanOrEqual(1);
  });
});
