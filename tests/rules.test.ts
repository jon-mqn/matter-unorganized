import { describe, expect, it } from "vitest";
import { referenceBoardBuild } from "../src/boards.js";
import { isValidSolution } from "../src/rules.js";
import { assignmentToState, cloneState } from "../src/state.js";
import { REFERENCE_SOLUTION } from "./fixtures.js";

describe("validity checker (§8.2)", () => {
  const board = referenceBoardBuild();
  const solutionState = assignmentToState(board, REFERENCE_SOLUTION);

  it("accepts the known-good reference solution", () => {
    expect(REFERENCE_SOLUTION.size).toBe(72);
    expect(isValidSolution(solutionState, board)).toBe(true);
  });

  it("rejects the board when any single cell is flipped", () => {
    // Balance is exact per line, so flipping any one cell breaks R2 on its line.
    for (let i = 0; i < solutionState.length; i++) {
      const flipped = cloneState(solutionState);
      flipped[i] = (flipped[i]! ^ 1) as 0 | 1;
      expect(isValidSolution(flipped, board)).toBe(false);
    }
  });
});
