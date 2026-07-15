import { EMPTY, SPECIAL } from "./types.js";
import { cloneState } from "./state.js";
/** Record a forced move, flagging contradictions against knowns / prior moves. */
function addMove(res, state, idx, val) {
    const known = state[idx];
    if (known !== EMPTY) {
        if (known !== val)
            res.contradiction = true;
        return; // already satisfied
    }
    const pending = res.moves.get(idx);
    if (pending !== undefined) {
        if (pending !== val)
            res.contradiction = true;
        return;
    }
    res.moves.set(idx, val);
}
/**
 * Per-cell elimination bitmask from no-three windows: bit c is set when placing
 * colour c at the cell would complete an equal triple (the window's other two
 * cells are filled with c).
 */
function windowEliminations(state, board) {
    const elim = new Uint8Array(state.length);
    for (const line of board.lines) {
        const cells = line.cells;
        for (let i = 0; i + 2 < cells.length; i++) {
            const a = state[cells[i]];
            const b = state[cells[i + 1]];
            const c = state[cells[i + 2]];
            if (a !== EMPTY && a === b && c === EMPTY)
                elim[cells[i + 2]] |= 1 << a;
            if (b !== EMPTY && b === c && a === EMPTY)
                elim[cells[i]] |= 1 << b;
            if (a !== EMPTY && a === c && b === EMPTY)
                elim[cells[i + 1]] |= 1 << a;
        }
    }
    return elim;
}
/**
 * Add count-cap eliminations into `elim`: for each line and colour already at
 * its target, eliminate that colour at the line's empty cells.
 */
function addCapEliminations(state, board, elim) {
    for (const line of board.lines) {
        const counts = new Array(board.colours).fill(0);
        let empties = 0;
        for (const ci of line.cells) {
            const v = state[ci];
            if (v === EMPTY)
                empties++;
            else
                counts[v]++;
        }
        if (empties === 0)
            continue;
        let mask = 0;
        for (let c = 0; c < line.targets.length; c++) {
            if (counts[c] >= line.targets[c])
                mask |= 1 << c;
        }
        if (mask === 0)
            continue;
        for (const ci of line.cells) {
            if (state[ci] === EMPTY)
                elim[ci] |= mask;
        }
    }
}
/** Force every empty cell whose candidate set has exactly one colour left. */
function nakedSingles(state, board, elim) {
    const res = { moves: new Map(), contradiction: false };
    const full = (1 << board.colours) - 1;
    for (let i = 0; i < state.length; i++) {
        if (state[i] !== EMPTY)
            continue;
        const allowed = full & ~elim[i];
        if (allowed === 0) {
            res.contradiction = true;
            return res;
        }
        if ((allowed & (allowed - 1)) === 0) {
            addMove(res, state, i, (31 - Math.clz32(allowed)));
        }
    }
    return res;
}
/** Tier 1 — no-three forcing: window eliminations leaving a single candidate. */
export function tier1Moves(state, board) {
    return nakedSingles(state, board, windowEliminations(state, board));
}
/**
 * Tier 2 — count forcing: window + cap eliminations leaving a single candidate
 * (the balance fill), plus the hidden single for the special: if only one cell
 * of a line can still hold its special, force it there.
 */
export function tier2Moves(state, board) {
    const elim = windowEliminations(state, board);
    addCapEliminations(state, board, elim);
    const res = nakedSingles(state, board, elim);
    if (res.contradiction)
        return res;
    if (board.colours > 2) {
        const specialBit = 1 << SPECIAL;
        for (const line of board.lines) {
            let placed = 0;
            const candidates = [];
            for (const ci of line.cells) {
                if (state[ci] === SPECIAL)
                    placed++;
                else if (state[ci] === EMPTY && (elim[ci] & specialBit) === 0) {
                    candidates.push(ci);
                }
            }
            if (placed >= line.targets[SPECIAL])
                continue;
            if (candidates.length === 0) {
                res.contradiction = true;
                return res;
            }
            if (candidates.length === 1) {
                addMove(res, state, candidates[0], SPECIAL);
            }
        }
    }
    return res;
}
/**
 * Tier 3 — line enumeration: enumerate every completion of a line consistent
 * with R1 ∧ R2 given knowns; force any cell constant across all completions.
 * Flags contradiction if any line has zero valid completions.
 */
export function tier3Moves(state, board) {
    const res = { moves: new Map(), contradiction: false };
    for (const line of board.lines) {
        const empties = [];
        for (const ci of line.cells)
            if (state[ci] === EMPTY)
                empties.push(ci);
        if (empties.length === 0)
            continue;
        const forced = lineForcedMoves(state, line, board.colours);
        if (forced === null) {
            res.contradiction = true;
            return res;
        }
        for (const [idx, val] of forced)
            addMove(res, state, idx, val);
    }
    return res;
}
/**
 * Tier 4 — trial to contradiction: for an empty cell, tentatively place each
 * surviving candidate and cascade tiers 1-3 to fixpoint; candidates that reach
 * a contradiction are eliminated. A cell with exactly one survivor is forced;
 * a cell with none is a contradiction. Still guess-free from the player's
 * perspective: the forced move is certain, only the justification is "every
 * other option runs into a dead end".
 *
 * Returns after the first forced move found — trials are expensive (each runs
 * a full tier-1..3 solve) and `logicSolve` restarts from tier 1 after any move
 * anyway, so finding more than one per invocation buys nothing.
 */
export function tier4Moves(state, board) {
    const res = { moves: new Map(), contradiction: false };
    const elim = windowEliminations(state, board);
    addCapEliminations(state, board, elim);
    const full = (1 << board.colours) - 1;
    for (let i = 0; i < state.length; i++) {
        if (state[i] !== EMPTY)
            continue;
        const allowed = full & ~elim[i];
        let survivors = 0;
        let survivor = 0;
        for (let c = 0; c < board.colours; c++) {
            if ((allowed & (1 << c)) === 0)
                continue;
            if (trialContradicts(state, board, i, c))
                continue;
            survivors++;
            survivor = c;
            if (survivors >= 2)
                break; // not forced; skip the remaining trials
        }
        if (survivors === 0) {
            res.contradiction = true;
            return res;
        }
        if (survivors === 1) {
            addMove(res, state, i, survivor);
            return res;
        }
    }
    return res;
}
/**
 * Would placing `val` at `idx` cascade (via tiers 1-2 run to fixpoint on a
 * scratch copy) into a contradiction? The cascade deliberately stops at tier 2:
 * including the tier-3 line DP catches more contradictions but costs an order
 * of magnitude more per trial, and trials run O(cells × candidates) times per
 * tier-4 invocation — with tier 3 in the loop, "really" generation blows the
 * web time budget several times over.
 */
function trialContradicts(state, board, idx, val) {
    const trial = cloneState(state);
    trial[idx] = val;
    for (;;) {
        let progressed = false;
        for (const tier of [tier1Moves, tier2Moves]) {
            const r = tier(trial, board);
            if (r.contradiction)
                return true;
            if (r.moves.size > 0) {
                for (const [i, v] of r.moves)
                    trial[i] = v;
                progressed = true;
                break; // restart from the lowest tier, mirroring logicSolve
            }
        }
        if (!progressed)
            return false;
    }
}
/**
 * For a line, compute which empty cells take the same value across every
 * R1∧R2-valid completion, and force them. Returns null if the line has no valid
 * completion (contradiction).
 *
 * Implemented as an O(L²) DP over line completions rather than enumerating all
 * colour^empties assignments, so it stays fast on long spines (a stacked pair
 * of size-14 blocks yields length-28 lines). State = (count of colour 0, count
 * of colour 1, last colour, run length); the count of the third colour is
 * derived from the position. Forward reachability F and backward completability
 * G are combined to find, per cell, which colours appear in some full valid
 * completion; a cell with exactly one possible colour is forced. This is the
 * memoised line enumeration anticipated by the spec (§10).
 */
function lineForcedMoves(state, line, colours) {
    const cells = line.cells;
    const L = line.length;
    const t0 = line.targets[0];
    const t1 = line.targets[1];
    const t2 = line.targets[2] ?? 0; // specials allowed (0 on classic boards)
    const fixed = cells.map((ci) => state[ci]);
    // State encoding: c0 in [0,t0], c1 in [0,t1], last colour in {0,1,2,3=none},
    // run length in {0,1,2}. The third colour's count is i - c0 - c1.
    const size = (t0 + 1) * (t1 + 1) * 4 * 3;
    const enc = (c0, c1, last, run) => ((c0 * (t1 + 1) + c1) * 4 + last) * 3 + run;
    const START = enc(0, 0, 3, 0);
    // Every valid transition from a state by placing colour `c` at position `i`.
    // Returns the successor state id, or -1 if the placement is illegal.
    const step = (id, c, i) => {
        if (fixed[i] !== EMPTY && fixed[i] !== c)
            return -1;
        const run = id % 3;
        const last = Math.floor(id / 3) % 4;
        const c1 = Math.floor(id / 12) % (t1 + 1);
        const c0 = Math.floor(id / (12 * (t1 + 1)));
        let nrun;
        if (last === c) {
            nrun = run + 1;
            if (nrun > 2)
                return -1; // R1: no three in a row
        }
        else {
            nrun = 1;
        }
        const nc0 = c0 + (c === 0 ? 1 : 0);
        const nc1 = c1 + (c === 1 ? 1 : 0);
        if (nc0 > t0 || nc1 > t1)
            return -1; // R2: over a colour's target
        if (i + 1 - nc0 - nc1 > t2)
            return -1; // R2: too many of the third colour
        return enc(nc0, nc1, c, nrun);
    };
    // Forward: F[i] = states reachable after filling positions 0..i-1.
    const F = Array.from({ length: L + 1 }, () => new Uint8Array(size));
    F[0][START] = 1;
    for (let i = 0; i < L; i++) {
        const Fi = F[i];
        const Fn = F[i + 1];
        for (let id = 0; id < size; id++) {
            if (!Fi[id])
                continue;
            for (let c = 0; c < colours; c++) {
                const ns = step(id, c, i);
                if (ns >= 0)
                    Fn[ns] = 1;
            }
        }
    }
    // Backward: G[i] = states at boundary i that can complete to a valid line.
    const G = Array.from({ length: L + 1 }, () => new Uint8Array(size));
    for (let id = 0; id < size; id++) {
        const c1 = Math.floor(id / 12) % (t1 + 1);
        const c0 = Math.floor(id / (12 * (t1 + 1)));
        if (c0 === t0 && c1 === t1)
            G[L][id] = 1; // accept: every target hit
    }
    for (let i = L - 1; i >= 0; i--) {
        const Gi = G[i];
        const Gn = G[i + 1];
        for (let id = 0; id < size; id++) {
            for (let c = 0; c < colours; c++) {
                const ns = step(id, c, i);
                if (ns >= 0 && Gn[ns]) {
                    Gi[id] = 1;
                    break;
                }
            }
        }
    }
    if (!G[0][START])
        return null; // no valid completion at all
    const forced = new Map();
    for (let i = 0; i < L; i++) {
        if (fixed[i] !== EMPTY)
            continue;
        const Fi = F[i];
        const Gn = G[i + 1];
        let allowedMask = 0;
        for (let id = 0; id < size; id++) {
            if (!Fi[id])
                continue;
            for (let c = 0; c < colours; c++) {
                if (allowedMask & (1 << c))
                    continue;
                const ns = step(id, c, i);
                if (ns >= 0 && Gn[ns])
                    allowedMask |= 1 << c;
            }
            if (allowedMask === (1 << colours) - 1)
                break;
        }
        if (allowedMask !== 0 && (allowedMask & (allowedMask - 1)) === 0) {
            forced.set(cells[i], (31 - Math.clz32(allowedMask)));
        }
    }
    return forced;
}
//# sourceMappingURL=tactics.js.map