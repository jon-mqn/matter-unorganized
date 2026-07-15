import { describe, expect, it } from "vitest";
import { buildBoard } from "../src/board.js";
import { buildStarBoard } from "../src/boards.js";

describe("board legality (§8.1)", () => {
  const board = buildStarBoard(9);

  it("has 81 cells", () => {
    expect(board.order.length).toBe(81);
  });

  it("has all odd-length lines with balanced targets plus one star", () => {
    expect(board.lines.length).toBe(18);
    for (const line of board.lines) {
      expect(line.length).toBe(9);
      expect(line.targets).toEqual([4, 4, 1]);
    }
  });

  it("every cell belongs to exactly one row-line and one column-line", () => {
    for (const ls of board.linesOf) expect(ls.length).toBe(2);
  });

  it("rejects a board whose lines would be even length", () => {
    expect(() =>
      buildBoard("bad", [{ rowStart: 1, rowEnd: 6, colStart: 1, colEnd: 6 }]),
    ).toThrow(/even length/);
  });
});
