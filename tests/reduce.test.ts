import { describe, expect, it } from "vitest";
import { referenceBoardBuild } from "../src/boards.js";
import { reduceLogic, reduceUnique } from "../src/reduce.js";
import { countSolutions } from "../src/solver.js";
import { isFullySolved } from "../src/logic.js";
import { makeRng } from "../src/rng.js";
import { assignmentToState } from "../src/state.js";
import { REFERENCE_SOLUTION } from "./fixtures.js";

describe("reducer correctness (§8.6)", () => {
  const board = referenceBoardBuild();
  const solution = assignmentToState(board, REFERENCE_SOLUTION);

  it("uniqueness-minimal output has a unique solution", () => {
    const clues = reduceUnique(solution, board, makeRng(7), 8);
    expect(countSolutions(clues, board, 2)).toBe(1);
    expect(clues.size).toBeLessThan(72);
  });

  it("logic-aware output is fully solved within its max tier", () => {
    const clues = reduceLogic(solution, board, makeRng(7), 3, 8);
    expect(isFullySolved(clues, board, 3)).toBe(true);
    expect(clues.size).toBeLessThan(72);
  });
});
