import { cellId } from "./types.js";
/**
 * Build a board from a union of rectangular blocks (§3.2). Line construction is
 * fully generic — it works for any union of blocks (stacked, offset, pinwheel,
 * with or without true overlap) with no special-casing. Classic boards require
 * every line length to be even (§2.1: R2 would be unsatisfiable otherwise);
 * star boards require every line length to be odd (2h + 1 special).
 */
export function buildBoard(id, blockDefs, variant = "classic") {
    // 1. Union all block cells into a de-duplicated set.
    const cellSet = new Map();
    for (const b of blockDefs) {
        for (let r = b.rowStart; r <= b.rowEnd; r++) {
            for (let c = b.colStart; c <= b.colEnd; c++) {
                cellSet.set(cellId(r, c), { r, c });
            }
        }
    }
    // Row-major traversal order.
    const order = [...cellSet.values()].sort((a, b) => a.r === b.r ? a.c - b.c : a.r - b.r);
    const cellIndex = new Map();
    order.forEach((cell, i) => cellIndex.set(cellId(cell.r, cell.c), i));
    const lines = [];
    // 2. Row-lines: group by row, split into maximal runs of adjacent columns.
    const byRow = new Map();
    for (const cell of order) {
        (byRow.get(cell.r) ?? byRow.set(cell.r, []).get(cell.r)).push(cell);
    }
    for (const [r, cells] of [...byRow.entries()].sort((a, b) => a[0] - b[0])) {
        cells.sort((a, b) => a.c - b.c);
        for (const run of splitRuns(cells, (cell) => cell.c)) {
            if (run.length >= 2) {
                lines.push(makeLine("row", r, run, cellIndex));
            }
        }
    }
    // 3. Column-lines: group by col, split into maximal runs of adjacent rows.
    const byCol = new Map();
    for (const cell of order) {
        (byCol.get(cell.c) ?? byCol.set(cell.c, []).get(cell.c)).push(cell);
    }
    for (const [c, cells] of [...byCol.entries()].sort((a, b) => a[0] - b[0])) {
        cells.sort((a, b) => a.r - b.r);
        for (const run of splitRuns(cells, (cell) => cell.r)) {
            if (run.length >= 2) {
                lines.push(makeLine("col", c, run, cellIndex));
            }
        }
    }
    // 4. Validate line-length parity and derive per-colour targets (R2).
    for (const line of lines) {
        if (variant === "classic") {
            if (line.length % 2 !== 0) {
                throw new Error(`Illegal board "${id}": ${line.axis}-line at index ${line.index} has ` +
                    `odd length ${line.length}; every line length must be even (R2).`);
            }
            line.targets = [line.length / 2, line.length / 2];
        }
        else {
            if (line.length % 2 !== 1) {
                throw new Error(`Illegal star board "${id}": ${line.axis}-line at index ${line.index} ` +
                    `has even length ${line.length}; every line needs 2h+1 cells ` +
                    `(h of each colour plus one special).`);
            }
            line.targets = [(line.length - 1) / 2, (line.length - 1) / 2, 1];
        }
    }
    // linesOf: per cell order index, which lines contain it (>= 1; overlap cells
    // may have more than 2 — the engine must not assume exactly 2).
    const linesOf = order.map(() => []);
    lines.forEach((line, li) => {
        for (const ci of line.cells)
            linesOf[ci].push(li);
    });
    return {
        id,
        order,
        cellIndex,
        lines,
        linesOf,
        blocks: blockDefs,
        colours: variant === "classic" ? 2 : 3,
    };
}
/** Split a coordinate-sorted cell list into maximal runs of adjacent coords. */
function splitRuns(cells, coord) {
    const runs = [];
    let current = [];
    let prev = Number.NaN;
    for (const cell of cells) {
        const v = coord(cell);
        if (current.length > 0 && v !== prev + 1) {
            runs.push(current);
            current = [];
        }
        current.push(cell);
        prev = v;
    }
    if (current.length > 0)
        runs.push(current);
    return runs;
}
function makeLine(axis, index, run, cellIndex) {
    const cells = run.map((cell) => cellIndex.get(cellId(cell.r, cell.c)));
    // targets is filled in after validation, once the variant's parity is known.
    return { axis, index, cells, length: cells.length, targets: [] };
}
//# sourceMappingURL=board.js.map