/**
 * Core data model for Offset-Block Unruly (§3 of the spec).
 *
 * Cells are 1-indexed internally to match the reference fixtures in §9.
 * A cell's colour is 0 (white) or 1 (black). Board geometry is defined by a
 * union of rectangular blocks; lines are derived generically (§3.2).
 */
/** The third cell state on star boards: exactly one per line. */
export const SPECIAL = 2;
export const EMPTY = -1;
export function cellId(r, c) {
    return `${r},${c}`;
}
//# sourceMappingURL=types.js.map