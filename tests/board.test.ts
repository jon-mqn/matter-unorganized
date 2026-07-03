import { describe, expect, it } from "vitest";
import { buildBoard } from "../src/board.js";
import { referenceBoardBuild } from "../src/boards.js";

describe("board legality (§8.1)", () => {
  const board = referenceBoardBuild();

  it("has 72 cells", () => {
    expect(board.order.length).toBe(72);
  });

  it("has all even-length lines", () => {
    for (const line of board.lines) {
      expect(line.length % 2).toBe(0);
    }
  });

  it("spine columns (4-6) are length 12, all others length 6", () => {
    for (const line of board.lines) {
      if (line.axis === "col" && line.index >= 4 && line.index <= 6) {
        expect(line.length).toBe(12);
      } else {
        expect(line.length).toBe(6);
      }
    }
  });

  it("every cell belongs to at least one line", () => {
    for (const ls of board.linesOf) expect(ls.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects a board whose lines would be odd length", () => {
    expect(() =>
      buildBoard("bad", [{ rowStart: 1, rowEnd: 5, colStart: 1, colEnd: 5 }]),
    ).toThrow(/odd length/);
  });
});
