import type { Assignment, Board, State } from "./types.js";
/** A fresh all-empty state for a board. */
export declare function emptyState(board: Board): State;
export declare function cloneState(state: State): State;
/** Build a state from a partial/total assignment (cellId -> colour). */
export declare function assignmentToState(board: Board, assignment: Assignment): State;
/** Extract the filled cells of a state as an assignment map. */
export declare function stateToAssignment(board: Board, state: State): Assignment;
/** Count of non-empty cells. */
export declare function filledCount(state: State): number;
