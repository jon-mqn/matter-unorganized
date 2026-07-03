import type { Assignment, Board, State } from "./types.js";
import { EMPTY, cellId } from "./types.js";

/** A fresh all-empty state for a board. */
export function emptyState(board: Board): State {
  return new Int8Array(board.order.length).fill(EMPTY);
}

export function cloneState(state: State): State {
  return new Int8Array(state);
}

/** Build a state from a partial/total assignment (cellId -> colour). */
export function assignmentToState(board: Board, assignment: Assignment): State {
  const state = emptyState(board);
  for (const [id, val] of assignment) {
    const idx = board.cellIndex.get(id);
    if (idx === undefined) throw new Error(`Unknown cell in assignment: ${id}`);
    state[idx] = val;
  }
  return state;
}

/** Extract the filled cells of a state as an assignment map. */
export function stateToAssignment(board: Board, state: State): Assignment {
  const out: Assignment = new Map();
  board.order.forEach((cell, idx) => {
    const v = state[idx]!;
    if (v !== EMPTY) out.set(cellId(cell.r, cell.c), v as 0 | 1);
  });
  return out;
}

/** Count of non-empty cells. */
export function filledCount(state: State): number {
  let n = 0;
  for (let i = 0; i < state.length; i++) if (state[i] !== EMPTY) n++;
  return n;
}
