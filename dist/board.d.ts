import type { Board, BlockDef } from "./types.js";
/**
 * Build a board from a union of rectangular blocks (§3.2). Line construction is
 * fully generic — it works for any union of blocks (stacked, offset, pinwheel,
 * with or without true overlap) with no special-casing. Throws if any resulting
 * line has odd length (§2.1: R2 would be unsatisfiable).
 */
export declare function buildBoard(id: string, blockDefs: BlockDef[]): Board;
