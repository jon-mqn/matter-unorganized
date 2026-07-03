import type { Assignment } from "../src/types.js";
import { cellId } from "../src/types.js";

/**
 * Reference fixtures from spec §9. Grids are given as space-separated glyphs:
 * `#`=1, `.`=0, `·`(or any other char)=empty. Top block occupies rows 1-6 /
 * cols 1-6; bottom block rows 7-12 / cols 4-9.
 */
function parseBlock(
  rows: string[],
  rowStart: number,
  colStart: number,
): [string, 0 | 1][] {
  const out: [string, 0 | 1][] = [];
  rows.forEach((row, ri) => {
    const glyphs = row.trim().split(/\s+/);
    glyphs.forEach((g, ci) => {
      if (g === "#") out.push([cellId(rowStart + ri, colStart + ci), 1]);
      else if (g === ".") out.push([cellId(rowStart + ri, colStart + ci), 0]);
      // anything else = empty, skip
    });
  });
  return out;
}

function assignment(entries: [string, 0 | 1][]): Assignment {
  return new Map(entries);
}

// §9 verified valid solution.
const SOLUTION_TOP = [
  ". # . # # .",
  ". # # . # .",
  "# . # . . #",
  "# . . # # .",
  ". # # . . #",
  "# . . # # .",
];
const SOLUTION_BOTTOM = [
  "# . . # . #",
  ". . # # . #",
  ". # # . # .",
  "# # . . # .",
  ". . # # . #",
  "# . # . # .",
];

export const REFERENCE_SOLUTION: Assignment = assignment([
  ...parseBlock(SOLUTION_TOP, 1, 1),
  ...parseBlock(SOLUTION_BOTTOM, 7, 4),
]);

// §9 verified deduction-only puzzle (13 clues, rates Hard).
const PUZZLE_TOP = [
  "· · · · · .",
  "· · # · # ·",
  "# · # · · ·",
  "· . · · · ·",
  "· · # · · ·",
  "· . · · # ·",
];
const PUZZLE_BOTTOM = [
  "· · . · · #",
  "· · · · · ·",
  "· # · · · ·",
  "· · · . · ·",
  "· · · · · ·",
  "· · · · · ·",
];

export const REFERENCE_PUZZLE_13: Assignment = assignment([
  ...parseBlock(PUZZLE_TOP, 1, 1),
  ...parseBlock(PUZZLE_BOTTOM, 7, 4),
]);
