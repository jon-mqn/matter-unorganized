import { describe, expect, it } from "vitest";
import { buildStarBoard } from "../src/boards.js";
import { isValidSolution } from "../src/rules.js";
import { cloneState, filledCount } from "../src/state.js";
import { S7_SOLUTION, parseGrid } from "./fixtures.js";

describe("validity checker (§8.2)", () => {
  const board = buildStarBoard(7);
  const solutionState = parseGrid(board, S7_SOLUTION);

  it("accepts the known-good s7 solution", () => {
    expect(filledCount(solutionState)).toBe(49);
    expect(isValidSolution(solutionState, board)).toBe(true);
  });

  it("rejects the board when any single cell is changed", () => {
    // Every line's counts are exact, so changing any one cell to either other
    // value breaks R2 on its row (colour count or star count).
    for (let i = 0; i < solutionState.length; i++) {
      for (const delta of [1, 2]) {
        const changed = cloneState(solutionState);
        changed[i] = ((changed[i]! + delta) % 3) as 0 | 1 | 2;
        expect(isValidSolution(changed, board)).toBe(false);
      }
    }
  });
});
