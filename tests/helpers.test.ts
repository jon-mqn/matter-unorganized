import { describe, expect, it } from "vitest";
import { buildStarBoard } from "../src/boards.js";
import { collectViolations } from "../src/rules.js";
import { nextForcedMove } from "../src/logic.js";
import { generate } from "../src/generate.js";
import { makeRng } from "../src/rng.js";
import { assignmentToState, emptyState } from "../src/state.js";
import { SPECIAL } from "../src/types.js";
import { S7_SOLUTION, parseGrid, set } from "./fixtures.js";

const board = buildStarBoard(7);

describe("collectViolations (UI highlighting helper)", () => {
  it("finds nothing on the valid solution", () => {
    const state = parseGrid(board, S7_SOLUTION);
    expect(collectViolations(state, board).size).toBe(0);
  });

  it("flags a three-in-a-row (R1)", () => {
    const state = emptyState(board);
    for (const c of [1, 2, 3]) set(board, state, 1, c, 1);
    const bad = collectViolations(state, board);
    for (const id of ["1,1", "1,2", "1,3"]) {
      expect(bad.has(board.cellIndex.get(id)!)).toBe(true);
    }
  });

  it("flags an over-full line (R2)", () => {
    const state = emptyState(board);
    // Four blacks on a length-7 row line exceeds the cap of 3.
    for (const c of [1, 2, 4, 5]) set(board, state, 1, c, 1);
    expect(collectViolations(state, board).size).toBeGreaterThan(0);
  });

  it("flags a second star in a line", () => {
    const state = emptyState(board);
    set(board, state, 1, 1, SPECIAL);
    set(board, state, 1, 4, SPECIAL);
    expect(collectViolations(state, board).size).toBeGreaterThan(0);
  });
});

describe("nextForcedMove (hint helper)", () => {
  // Deterministic hard s7 puzzle from the shipped pipeline.
  const puzzle = generate(board, "hard", makeRng(3), { passes: 8, attempts: 10 });

  it("returns a sound forced move on a partial puzzle", () => {
    const state = assignmentToState(board, puzzle.clues);
    const move = nextForcedMove(state, board, 3);
    expect(move).not.toBeNull();
    // Soundness: the forced value matches the real solution.
    const solution = assignmentToState(board, puzzle.solution);
    expect(move!.val).toBe(solution[move!.cellIdx]);
    expect(move!.tier).toBeGreaterThanOrEqual(1);
  });

  it("returns null on a completed board", () => {
    const state = parseGrid(board, S7_SOLUTION);
    expect(nextForcedMove(state, board, 3)).toBeNull();
  });
});
