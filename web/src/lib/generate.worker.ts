// Runs puzzle generation off the main thread (cost grows with board size). The
// board is not serialized — it is deterministic, so the main thread rebuilds it
// from the board token. Effort (passes/attempts) is scaled to the board size.
import { generate, generationBudget, makeRng, resolveBoard } from "@engine/index.js";
import { assignmentToEntries, type GenRequest, type GenResponse } from "./engine.js";

self.onmessage = (e: MessageEvent<GenRequest>) => {
  const { boardId, difficulty, seed } = e.data;
  const board = resolveBoard(boardId);
  const budget = generationBudget(board.order.length);
  const puzzle = generate(board, difficulty, makeRng(seed), budget);

  const res: GenResponse = {
    boardId,
    difficulty,
    seed,
    rating: puzzle.rating,
    counts: puzzle.counts,
    clues: assignmentToEntries(puzzle.clues),
    solution: assignmentToEntries(puzzle.solution),
  };
  (self as unknown as Worker).postMessage(res);
};
