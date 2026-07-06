import { EMPTY } from "./types.js";
/**
 * Line-evaluation primitives (§4.1). These are the only place the two rules are
 * encoded. R2 is generalised to a per-line target count per colour
 * (`line.targets`): classic boards use [L/2, L/2]; star boards use
 * [(L-1)/2, (L-1)/2, 1]. R1 (no-three) compares raw values, so it applies to
 * any number of cell states unchanged.
 */
/** R1: does the line contain a completed triple of equal colour? */
export function lineViolatesNoThree(state, line) {
    const cells = line.cells;
    for (let i = 0; i + 2 < cells.length; i++) {
        const a = state[cells[i]];
        if (a === EMPTY)
            continue;
        if (a === state[cells[i + 1]] && a === state[cells[i + 2]])
            return true;
    }
    return false;
}
/** Count of each colour currently placed on the line. */
export function lineColourCounts(state, line, colours) {
    const counts = new Array(colours).fill(0);
    for (const ci of line.cells) {
        const v = state[ci];
        if (v !== EMPTY)
            counts[v]++;
    }
    return counts;
}
/** R2 feasibility: does any colour already exceed its target on the line? */
export function lineCountExceedsCap(state, line, colours = line.targets.length) {
    const counts = lineColourCounts(state, line, colours);
    for (let c = 0; c < line.targets.length; c++) {
        if (counts[c] > line.targets[c])
            return true;
    }
    return false;
}
/**
 * Partial-legality check (§4.1). Tentatively place `val` at `cellIdx` and, for
 * each line touching the cell, verify R2 feasibility (no colour exceeds its
 * target) and R1 (no completed equal triple in a 3-window touching the cell).
 * Restores the state before returning. O(lines touching the cell), not O(board).
 */
export function legal(state, cellIdx, val, board) {
    const prev = state[cellIdx];
    state[cellIdx] = val;
    try {
        for (const li of board.linesOf[cellIdx]) {
            const line = board.lines[li];
            if (lineCountExceedsCap(state, line, board.colours))
                return false;
            if (windowViolationTouching(state, line, cellIdx))
                return false;
        }
        return true;
    }
    finally {
        state[cellIdx] = prev;
    }
}
/** Check only the 3-windows of `line` that include `cellIdx`. */
function windowViolationTouching(state, line, cellIdx) {
    const cells = line.cells;
    const pos = cells.indexOf(cellIdx);
    if (pos < 0)
        return false;
    for (let start = pos - 2; start <= pos; start++) {
        if (start < 0 || start + 2 >= cells.length)
            continue;
        const a = state[cells[start]];
        if (a === EMPTY)
            continue;
        if (a === state[cells[start + 1]] && a === state[cells[start + 2]]) {
            return true;
        }
    }
    return false;
}
/** Full board validity for a total assignment (used by tests / §8.2). */
export function isValidSolution(state, board) {
    for (const line of board.lines) {
        // R2: every colour hits its exact target in a completed line.
        const counts = new Array(board.colours).fill(0);
        for (const ci of line.cells) {
            const v = state[ci];
            if (v === EMPTY)
                return false;
            counts[v]++;
        }
        for (let c = 0; c < line.targets.length; c++) {
            if (counts[c] !== line.targets[c])
                return false;
        }
        if (lineViolatesNoThree(state, line))
            return false;
    }
    return true;
}
/**
 * Collect every cell index sitting on a line that currently breaks a rule:
 * a completed equal triple (R1) or a colour already exceeding its target (R2).
 * Intended for UI highlighting; reuses the line primitives above. A cell may be
 * reported via any of its lines.
 */
export function collectViolations(state, board) {
    const bad = new Set();
    for (const line of board.lines) {
        if (lineCountExceedsCap(state, line, board.colours)) {
            // Only the filled cells of the over-full colour are "at fault"; simplest
            // and clearest for the player is to flag the whole offending line's fills.
            for (const ci of line.cells)
                if (state[ci] !== EMPTY)
                    bad.add(ci);
        }
        // Flag the specific triples that violate R1.
        const cells = line.cells;
        for (let i = 0; i + 2 < cells.length; i++) {
            const a = state[cells[i]];
            if (a === EMPTY)
                continue;
            if (a === state[cells[i + 1]] && a === state[cells[i + 2]]) {
                bad.add(cells[i]);
                bad.add(cells[i + 1]);
                bad.add(cells[i + 2]);
            }
        }
    }
    return bad;
}
//# sourceMappingURL=rules.js.map