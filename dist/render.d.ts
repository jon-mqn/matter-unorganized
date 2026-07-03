import type { Assignment, Board } from "./types.js";
/**
 * Render a board assignment as ASCII, laid out by (row, col) so offset blocks
 * appear staggered (matching the spec §9 fixtures). Glyphs: `#`=1, `.`=0,
 * and the `empty` glyph (default `·`) for unassigned cells.
 */
export declare function renderAscii(board: Board, assignment: Assignment, empty?: string): string;
