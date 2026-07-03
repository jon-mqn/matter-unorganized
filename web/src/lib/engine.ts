// Thin re-export of the puzzle engine (repo-root src/) plus (de)serialization
// helpers for passing puzzles across the Web Worker boundary, where Maps must
// travel as plain entry arrays.
export * from "@engine/index.js";

import type { Assignment, Difficulty, Rating, TierCounts } from "@engine/index.js";

export type AssignmentEntries = [string, 0 | 1][];

export function assignmentToEntries(a: Assignment): AssignmentEntries {
  return [...a.entries()];
}

export function entriesToAssignment(e: AssignmentEntries): Assignment {
  return new Map(e);
}

/** Request posted to the generation worker. */
export interface GenRequest {
  boardId: string;
  difficulty: Difficulty;
  seed: number;
}

/** Serializable response from the generation worker. */
export interface GenResponse {
  boardId: string;
  difficulty: Difficulty;
  seed: number;
  rating: Rating;
  counts: TierCounts;
  clues: AssignmentEntries;
  solution: AssignmentEntries;
}
