import { describe, expect, it } from "vitest";
import type { Difficulty } from "../src/types.js";
import { buildStarBoard } from "../src/boards.js";
import { generate } from "../src/generate.js";
import { logicSolve } from "../src/logic.js";
import { makeRng } from "../src/rng.js";

describe("generator banding (§8.7)", () => {
  const board = buildStarBoard(7);

  for (const difficulty of ["normal", "hard", "really"] as Difficulty[]) {
    it(`generates ${difficulty} puzzles rating exactly ${difficulty}`, () => {
      for (const seed of [1, 2, 3]) {
        const puzzle = generate(board, difficulty, makeRng(seed), {
          passes: 6,
          attempts: 12,
        });
        expect(puzzle.rating).toBe(difficulty);
        // A shipped puzzle must be fully solvable by deduction (tier 4 max).
        expect(logicSolve(puzzle.clues, board, 4).status).toBe("solved");
      }
    });
  }
});

describe("determinism (§8.8)", () => {
  const board = buildStarBoard(7);

  it("same seed yields an identical puzzle", () => {
    const a = generate(board, "hard", makeRng(99), { passes: 8 });
    const b = generate(board, "hard", makeRng(99), { passes: 8 });
    expect([...a.clues.entries()].sort()).toEqual(
      [...b.clues.entries()].sort(),
    );
    expect([...a.solution.entries()].sort()).toEqual(
      [...b.solution.entries()].sort(),
    );
  });
});
