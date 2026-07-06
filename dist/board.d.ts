import type { Board, BlockDef } from "./types.js";
/** Board variant: classic two-colour, or star (white/black + one special). */
export type Variant = "classic" | "star";
/**
 * Build a board from a union of rectangular blocks (§3.2). Line construction is
 * fully generic — it works for any union of blocks (stacked, offset, pinwheel,
 * with or without true overlap) with no special-casing. Classic boards require
 * every line length to be even (§2.1: R2 would be unsatisfiable otherwise);
 * star boards require every line length to be odd (2h + 1 special).
 */
export declare function buildBoard(id: string, blockDefs: BlockDef[], variant?: Variant): Board;
