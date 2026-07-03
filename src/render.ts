import type { Assignment, Board } from "./types.js";
import { cellId } from "./types.js";

/**
 * Render a board assignment as ASCII, laid out by (row, col) so offset blocks
 * appear staggered (matching the spec §9 fixtures). Glyphs: `#`=1, `.`=0,
 * and the `empty` glyph (default `·`) for unassigned cells.
 */
export function renderAscii(
  board: Board,
  assignment: Assignment,
  empty = "·",
): string {
  let minR = Infinity,
    maxR = -Infinity,
    minC = Infinity,
    maxC = -Infinity;
  const present = new Set<string>();
  for (const cell of board.order) {
    present.add(cellId(cell.r, cell.c));
    minR = Math.min(minR, cell.r);
    maxR = Math.max(maxR, cell.r);
    minC = Math.min(minC, cell.c);
    maxC = Math.max(maxC, cell.c);
  }

  const rowLabelWidth = String(maxR).length;
  const pad = (s: string, w: number) => s.padStart(w);

  const header =
    " ".repeat(rowLabelWidth + 2) +
    Array.from({ length: maxC - minC + 1 }, (_, i) => String(minC + i)).join(" ");
  const lines = [header];

  for (let r = minR; r <= maxR; r++) {
    const glyphs: string[] = [];
    for (let c = minC; c <= maxC; c++) {
      if (!present.has(cellId(r, c))) {
        glyphs.push(" ");
        continue;
      }
      const v = assignment.get(cellId(r, c));
      glyphs.push(v === 1 ? "#" : v === 0 ? "." : empty);
    }
    lines.push(`${pad("r" + r, rowLabelWidth + 1)} ${glyphs.join(" ")}`);
  }
  return lines.join("\n");
}
