import { describe, expect, it } from "vitest";
import { referenceBoardBuild } from "../src/boards.js";
import { logicSolve, rate } from "../src/logic.js";
import { assignmentToState } from "../src/state.js";
import { REFERENCE_PUZZLE_13, REFERENCE_SOLUTION } from "./fixtures.js";

describe("logic solver soundness (§8.4)", () => {
  const board = referenceBoardBuild();
  const solutionState = assignmentToState(board, REFERENCE_SOLUTION);

  it("every move agrees with the seed solution", () => {
    const { state, status } = logicSolve(REFERENCE_PUZZLE_13, board, 3);
    expect(status).toBe("solved");
    for (let i = 0; i < state.length; i++) {
      expect(state[i]).toBe(solutionState[i]);
    }
  });
});

describe("logic solver completeness band (§8.5)", () => {
  const board = referenceBoardBuild();

  it("solves the 13-clue reference puzzle and rates Hard with Tier-3 used", () => {
    const { rating, counts } = rate(REFERENCE_PUZZLE_13, board);
    expect(rating).toBe("hard");
    expect(counts.tier3).toBeGreaterThanOrEqual(1);
  });
});
