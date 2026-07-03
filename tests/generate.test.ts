import { describe, expect, it } from "vitest";
import type { Difficulty } from "../src/types.js";
import { referenceBoardBuild } from "../src/boards.js";
import { generate } from "../src/generate.js";
import { logicSolve } from "../src/logic.js";
import { makeRng } from "../src/rng.js";

describe("generator banding (§8.7)", () => {
  const board = referenceBoardBuild();

  for (const difficulty of ["easy", "medium", "hard"] as Difficulty[]) {
    it(`generates ${difficulty} puzzles rating exactly ${difficulty}`, () => {
      for (const seed of [1, 2, 3]) {
        const puzzle = generate(board, difficulty, makeRng(seed), { passes: 12 });
        expect(puzzle.rating).toBe(difficulty);
        // A shipped puzzle must be fully solvable by deduction.
        expect(logicSolve(puzzle.clues, board, 3).status).toBe("solved");
      }
    });
  }
});

describe("determinism (§8.8)", () => {
  const board = referenceBoardBuild();

  it("same seed yields an identical puzzle", () => {
    const a = generate(board, "hard", makeRng(99), { passes: 12 });
    const b = generate(board, "hard", makeRng(99), { passes: 12 });
    expect([...a.clues.entries()].sort()).toEqual(
      [...b.clues.entries()].sort(),
    );
    expect([...a.solution.entries()].sort()).toEqual(
      [...b.solution.entries()].sort(),
    );
  });
});
