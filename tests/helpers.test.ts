import { describe, expect, it } from "vitest";
import { referenceBoardBuild } from "../src/boards.js";
import { collectViolations } from "../src/rules.js";
import { nextForcedMove } from "../src/logic.js";
import { assignmentToState, emptyState } from "../src/state.js";
import { REFERENCE_PUZZLE_13, REFERENCE_SOLUTION } from "./fixtures.js";

const board = referenceBoardBuild();

describe("collectViolations (UI highlighting helper)", () => {
  it("finds nothing on the valid solution", () => {
    const state = assignmentToState(board, REFERENCE_SOLUTION);
    expect(collectViolations(state, board).size).toBe(0);
  });

  it("flags a three-in-a-row (R1)", () => {
    const state = emptyState(board);
    // Cells (1,1),(1,2),(1,3) are the first three of row-line 1.
    for (const id of ["1,1", "1,2", "1,3"]) {
      state[board.cellIndex.get(id)!] = 1;
    }
    const bad = collectViolations(state, board);
    for (const id of ["1,1", "1,2", "1,3"]) {
      expect(bad.has(board.cellIndex.get(id)!)).toBe(true);
    }
  });

  it("flags an over-full line (R2)", () => {
    const state = emptyState(board);
    // Four blacks on a length-6 row line exceeds the cap of 3.
    for (const id of ["1,1", "1,2", "1,4", "1,5"]) {
      state[board.cellIndex.get(id)!] = 1;
    }
    expect(collectViolations(state, board).size).toBeGreaterThan(0);
  });
});

describe("nextForcedMove (hint helper)", () => {
  it("returns a sound forced move on a partial puzzle", () => {
    const state = assignmentToState(board, REFERENCE_PUZZLE_13);
    const move = nextForcedMove(state, board, 3);
    expect(move).not.toBeNull();
    // Soundness: the forced value matches the real solution.
    const solution = assignmentToState(board, REFERENCE_SOLUTION);
    expect(move!.val).toBe(solution[move!.cellIdx]);
    expect(move!.tier).toBeGreaterThanOrEqual(1);
  });

  it("returns null on a completed board", () => {
    const state = assignmentToState(board, REFERENCE_SOLUTION);
    expect(nextForcedMove(state, board, 3)).toBeNull();
  });
});
