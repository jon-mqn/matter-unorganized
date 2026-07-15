import type { Board, State } from "../src/types.js";
import { SPECIAL, cellId } from "../src/types.js";
import { emptyState } from "../src/state.js";

/**
 * Star-board fixtures. Grids are space-separated glyphs: `#`=1, `.`=0,
 * `*`=star, anything else = empty. Rows/columns are 1-based from the top-left.
 */

/** Hand-verified 7×7 star solution (3 of each colour + one star per line). */
export const S7_SOLUTION = [
  "* . # . . # #",
  "# * . # # . .",
  ". # # . * # .",
  "# . # . # . *",
  ". . * # # . #",
  "# # . * . # .",
  ". # . # . * #",
];

export function parseGrid(board: Board, rows: string[]): State {
  const state = emptyState(board);
  rows.forEach((row, ri) => {
    row
      .trim()
      .split(/\s+/)
      .forEach((g, ci) => {
        const idx = board.cellIndex.get(cellId(ri + 1, ci + 1))!;
        if (g === "#") state[idx] = 1;
        else if (g === ".") state[idx] = 0;
        else if (g === "*") state[idx] = SPECIAL;
      });
  });
  return state;
}

export function set(
  board: Board,
  state: State,
  r: number,
  c: number,
  v: number,
): void {
  state[board.cellIndex.get(cellId(r, c))!] = v;
}

export function at(board: Board, r: number, c: number): number {
  return board.cellIndex.get(cellId(r, c))!;
}
