import { describe, expect, it } from "vitest";
import {
  REFERENCE_BLOCKS,
  arrangeBlocks,
  boardToken,
  buildStackedBoard,
  parseArrSeed,
  parseBoardToken,
  resolveBoard,
  stackedBlockDefs,
  validateSizes,
} from "../src/boards.js";
import { buildBoard } from "../src/board.js";
import { generate } from "../src/generate.js";
import { logicSolve } from "../src/logic.js";
import { makeRng } from "../src/rng.js";

describe("stacked Frankengrid geometry", () => {
  it("[6,6] reproduces the reference board", () => {
    expect(stackedBlockDefs([6, 6])).toEqual(REFERENCE_BLOCKS);
  });

  it("produces only even-length lines for mixed sizes", () => {
    const board = buildStackedBoard([6, 6, 8]);
    expect(board.order.length).toBe(6 * 6 + 6 * 6 + 8 * 8); // 136 cells
    for (const line of board.lines) expect(line.length % 2).toBe(0);
    // Only consecutive blocks overlap, so the longest line is the largest
    // adjacent height sum: max(6+6, 6+8) = 14 (never more than 2*maxSize).
    const longest = Math.max(...board.lines.map((l) => l.length));
    expect(longest).toBe(14);
  });

  it("keeps every cell in at most two lines (no triple overlap)", () => {
    const board = buildStackedBoard([14, 6, 14]);
    for (const ls of board.linesOf) expect(ls.length).toBeLessThanOrEqual(2);
  });

  it("validates size rules", () => {
    expect(() => validateSizes([7, 6])).toThrow(/even/);
    expect(() => validateSizes([4])).toThrow(/between/);
    expect(() => validateSizes([16])).toThrow(/between/);
    expect(() => validateSizes([])).toThrow(/at least one/);
    expect(() => validateSizes([6, 6, 6, 6, 6, 6])).toThrow(/at most/);
    expect(() => validateSizes([6, 8, 14])).not.toThrow();
  });

  it("parses board tokens", () => {
    expect(parseBoardToken("reference")).toEqual([6, 6]);
    expect(parseBoardToken("6-6-8")).toEqual([6, 6, 8]);
    expect(parseBoardToken("6-7")).toBeNull();
    expect(parseBoardToken("abc")).toBeNull();
  });

  it("generates a solvable puzzle on a custom board", () => {
    const board = buildStackedBoard([8, 8]);
    const puzzle = generate(board, "medium", makeRng(3), { passes: 8 });
    expect(logicSolve(puzzle.clues, board, 3).status).toBe("solved");
  });
});

describe("randomised arrangements", () => {
  const configs = [[6, 6], [6, 6, 8], [8, 8, 8], [14, 6, 14], [10, 10, 10, 10]];

  it("keep every line even for any sizes and seed (incl. side/overlap)", () => {
    for (const sizes of configs) {
      for (let seed = 0; seed < 40; seed++) {
        // buildBoard throws on any odd line, so a clean build proves R2-legality.
        const defs = arrangeBlocks(sizes, seed);
        const board = buildBoard(boardToken(sizes, seed), defs);
        for (const line of board.lines) expect(line.length % 2).toBe(0);
        // Overlaps mean cell count never exceeds the sum of squares.
        expect(board.order.length).toBeLessThanOrEqual(
          sizes.reduce((n, s) => n + s * s, 0),
        );
      }
    }
  });

  it("actually varies the shape across seeds", () => {
    const shapes = new Set(
      Array.from({ length: 20 }, (_, s) =>
        JSON.stringify(arrangeBlocks([6, 6, 8], s)),
      ),
    );
    expect(shapes.size).toBeGreaterThan(3);
  });

  it("produces side-by-side and overlapping layouts, not just a staircase", () => {
    let sawSideBySide = false;
    let sawOverlap = false;
    for (let seed = 0; seed < 60 && !(sawSideBySide && sawOverlap); seed++) {
      const board = resolveBoard(boardToken([6, 6, 8], seed));
      // Side-by-side => a row line longer than the widest single block (a row
      // run spanning two blocks). Overlap => fewer cells than sum of squares.
      const maxRow = Math.max(
        ...board.lines.filter((l) => l.axis === "row").map((l) => l.length),
      );
      if (maxRow > 8) sawSideBySide = true;
      if (board.order.length < 136) sawOverlap = true;
    }
    expect(sawSideBySide).toBe(true);
    expect(sawOverlap).toBe(true);
  });

  it("round-trips board tokens with an arrangement seed", () => {
    expect(boardToken([6, 6, 8])).toBe("6-6-8");
    expect(boardToken([6, 6, 8], 42)).toBe("6-6-8~42");
    expect(parseArrSeed("6-6-8~42")).toBe(42);
    expect(parseArrSeed("6-6-8")).toBeUndefined();
    expect(parseBoardToken("6-6-8~42")).toEqual([6, 6, 8]);
  });

  it("generates a solvable puzzle on an arranged (overlapping) board", () => {
    const board = resolveBoard("8-8-8~7");
    const puzzle = generate(board, "medium", makeRng(1), { passes: 8 });
    expect(logicSolve(puzzle.clues, board, 3).status).toBe("solved");
  });
});
