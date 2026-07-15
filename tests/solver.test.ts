import { describe, expect, it } from "vitest";
import { buildStarBoard } from "../src/boards.js";
import { countSolutions, randomSolution } from "../src/solver.js";
import { isValidSolution } from "../src/rules.js";
import { makeRng } from "../src/rng.js";
import { stateToAssignment } from "../src/state.js";
import { SPECIAL } from "../src/types.js";
import { S7_SOLUTION, parseGrid } from "./fixtures.js";

describe("solution counter (§8.3)", () => {
  const board = buildStarBoard(7);
  const solutionClues = stateToAssignment(board, parseGrid(board, S7_SOLUTION));

  it("returns 1 for a near-complete puzzle with a forced last cell", () => {
    // Full solution minus one cell has exactly one completion.
    const clues = new Map(solutionClues);
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

  it("places exactly one star per row and column", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const state = randomSolution(board, makeRng(seed));
      for (const line of board.lines) {
        const stars = line.cells.filter((ci) => state[ci] === SPECIAL).length;
        expect(stars).toBe(1);
      }
    }
  });

  it("distributes stars ~uniformly (no diagonal bias)", () => {
    const counts = new Array<number>(49).fill(0);
    const N = 300; // fixed seeds, so the bound is deterministic
    for (let seed = 1; seed <= N; seed++) {
      const state = randomSolution(board, makeRng(seed));
      for (let i = 0; i < 49; i++) if (state[i] === SPECIAL) counts[i]!++;
    }
    // Expected N/7 ≈ 42.9 per cell, σ ≈ 6.1; bounds ≈ ±3.5σ. The old greedy
    // DFS fill fails hard here (corner cells hit ~102 and ~12).
    for (const c of counts) {
      expect(c).toBeGreaterThan(21);
      expect(c).toBeLessThan(64);
    }
  });
});
