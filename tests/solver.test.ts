import { describe, expect, it } from "vitest";
import { referenceBoardBuild } from "../src/boards.js";
import { countSolutions, randomSolution } from "../src/solver.js";
import { isValidSolution } from "../src/rules.js";
import { makeRng } from "../src/rng.js";
import { stateToAssignment } from "../src/state.js";
import { REFERENCE_SOLUTION } from "./fixtures.js";

describe("solution counter (§8.3)", () => {
  const board = referenceBoardBuild();

  it("returns 1 for a near-complete puzzle with a forced last cell", () => {
    // Full solution minus one cell has exactly one completion.
    const clues = new Map(REFERENCE_SOLUTION);
    const [first] = clues.keys();
    clues.delete(first!);
    expect(countSolutions(clues, board, 2)).toBe(1);
  });

  it("returns >= 2 (cap hit) for the empty board", () => {
    expect(countSolutions(new Map(), board, 2)).toBe(2);
  });

  it("random fill produces a valid solution and is deterministic per seed", () => {
    const a = randomSolution(board, makeRng(42));
    const b = randomSolution(board, makeRng(42));
    expect(isValidSolution(a, board)).toBe(true);
    expect(stateToAssignment(board, a)).toEqual(stateToAssignment(board, b));
  });
});
