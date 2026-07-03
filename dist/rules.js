import { EMPTY } from "./types.js";
/**
 * Line-evaluation primitives (§4.1). These are the only place the two rules are
 * encoded, and they are colour-count-agnostic via `k` so the k-colour hook of
 * §2.2 can be enabled later without touching the engine. Default k = 2.
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
/** R2 feasibility: does any colour already exceed its cap of L/k on the line? */
export function lineCountExceedsCap(state, line, k = 2) {
    const cap = line.length / k;
    let ones = 0;
    let zeros = 0;
    for (const ci of line.cells) {
        const v = state[ci];
        if (v === 1)
            ones++;
        else if (v === 0)
            zeros++;
    }
    return ones > cap || zeros > cap;
}
/**
 * Partial-legality check (§4.1). Tentatively place `val` at `cellIdx` and, for
 * each line touching the cell, verify R2 feasibility (no colour exceeds L/k) and
 * R1 (no completed equal triple in a 3-window touching the cell). Restores the
 * state before returning. O(lines touching the cell), not O(board).
 */
export function legal(state, cellIdx, val, board, k = 2) {
    const prev = state[cellIdx];
    state[cellIdx] = val;
    try {
        for (const li of board.linesOf[cellIdx]) {
            const line = board.lines[li];
            if (lineCountExceedsCap(state, line, k))
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
export function isValidSolution(state, board, k = 2) {
    for (const line of board.lines) {
        // R2: exact balance for a completed line.
        let ones = 0;
        for (const ci of line.cells) {
            const v = state[ci];
            if (v === EMPTY)
                return false;
            if (v === 1)
                ones++;
        }
        if (ones !== line.length / k)
            return false;
        if (lineViolatesNoThree(state, line))
            return false;
    }
    return true;
}
/**
 * Collect every cell index sitting on a line that currently breaks a rule:
 * a completed equal triple (R1) or a colour already exceeding its L/k cap (R2).
 * Intended for UI highlighting; reuses the line primitives above. A cell may be
 * reported via any of its lines.
 */
export function collectViolations(state, board, k = 2) {
    const bad = new Set();
    for (const line of board.lines) {
        if (lineCountExceedsCap(state, line, k)) {
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