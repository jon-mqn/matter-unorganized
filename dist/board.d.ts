import type { Board, BlockDef } from "./types.js";
/**
 * Build a board from a union of rectangular blocks (§3.2). Line construction is
 * fully generic — it works for any union of blocks with no special-casing.
 * Every line length must be odd (2h + 1: h of each colour plus one special),
 * or R2 would be unsatisfiable.
 */
export declare function buildBoard(id: string, blockDefs: BlockDef[]): Board;
