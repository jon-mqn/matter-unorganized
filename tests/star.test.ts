import { describe, expect, it } from "vitest";
import { buildBoard } from "../src/board.js";
import {
  buildStarBoard,
  parseStarSize,
  resolveBoard,
  starBoardToken,
} from "../src/boards.js";
import { EMPTY, SPECIAL } from "../src/types.js";
import { emptyState, assignmentToState, stateToAssignment } from "../src/state.js";
import { isValidSolution } from "../src/rules.js";
import { tier1Moves, tier2Moves, tier3Moves, tier4Moves } from "../src/tactics.js";
import { logicSolve, nextForcedMove } from "../src/logic.js";
import { generate } from "../src/generate.js";
import { makeRng } from "../src/rng.js";
import { S7_SOLUTION, at, parseGrid, set } from "./fixtures.js";

describe("star board build", () => {
  const board = buildStarBoard(7);

  it("has 49 cells, 14 lines of length 7, 3 colours", () => {
    expect(board.order.length).toBe(49);
    expect(board.lines.length).toBe(14);
    expect(board.colours).toBe(3);
    for (const line of board.lines) {
      expect(line.length).toBe(7);
      expect(line.targets).toEqual([3, 3, 1]);
    }
  });

  it("rejects even-length lines", () => {
    expect(() =>
      buildBoard("bad", [{ rowStart: 1, rowEnd: 6, colStart: 1, colEnd: 6 }]),
    ).toThrow(/even length/);
  });

  it("parses and resolves star tokens", () => {
    expect(parseStarSize("s7")).toBe(7);
    expect(parseStarSize("s15")).toBe(15);
    expect(parseStarSize("s8")).toBeNull();
    expect(parseStarSize("7")).toBeNull();
    expect(starBoardToken(9)).toBe("s9");
    expect(resolveBoard("s9").order.length).toBe(81);
    expect(() => buildStarBoard(6)).toThrow(/must be one of/);
    expect(() => resolveBoard("6-6")).toThrow(/Invalid board/);
  });
});

describe("star validity (R1 + generalised R2)", () => {
  const board = buildStarBoard(7);

  it("accepts the verified 7×7 solution", () => {
    expect(isValidSolution(parseGrid(board, S7_SOLUTION), board)).toBe(true);
  });

  it("rejects a colour-count imbalance", () => {
    const state = parseGrid(board, S7_SOLUTION);
    set(board, state, 1, 2, 1); // white -> black: row 1 now 4 black / 2 white
    expect(isValidSolution(state, board)).toBe(false);
  });

  it("rejects a second special in a line", () => {
    const state = parseGrid(board, S7_SOLUTION);
    set(board, state, 1, 2, SPECIAL); // row 1 and column 2 now hold 2 specials
    expect(isValidSolution(state, board)).toBe(false);
  });

  it("rejects a triple even when counts still fit", () => {
    const state = parseGrid(board, S7_SOLUTION);
    // r5: . . * # # . #  ->  swap c6/c7 to make # # # at c4-c6? Instead build
    // a fresh row with a triple: set r5 = . . * # # # . (3 consecutive black).
    set(board, state, 5, 6, 1);
    set(board, state, 5, 7, 0);
    expect(isValidSolution(state, board)).toBe(false);
  });
});

describe("star tactics", () => {
  const board = buildStarBoard(7);

  it("tier 1 does NOT force on a bare pair (three candidates)", () => {
    const state = emptyState(board);
    set(board, state, 1, 2, 1);
    set(board, state, 1, 3, 1); // [_, #, #] leaves {white, star} at r1c1
    const res = tier1Moves(state, board);
    expect(res.contradiction).toBe(false);
    expect(res.moves.size).toBe(0);
  });

  it("tier 1 forces a star when both colours are window-blocked", () => {
    const state = emptyState(board);
    set(board, state, 1, 2, 1);
    set(board, state, 1, 3, 1); // row blocks black at r1c1
    set(board, state, 2, 1, 0);
    set(board, state, 3, 1, 0); // column blocks white at r1c1
    const res = tier1Moves(state, board);
    expect(res.moves.get(at(board, 1, 1))).toBe(SPECIAL);
  });

  it("tier 2 fills a line whose black count and star are exhausted", () => {
    const state = emptyState(board);
    set(board, state, 1, 1, SPECIAL);
    set(board, state, 1, 2, 1);
    set(board, state, 1, 4, 1);
    set(board, state, 1, 6, 1); // 3 black + star placed -> rest is white
    const res = tier2Moves(state, board);
    for (const c of [3, 5, 7]) {
      expect(res.moves.get(at(board, 1, c))).toBe(0);
    }
  });

  it("tier 2 finds the hidden single for the star", () => {
    const state = emptyState(board);
    // Stars already placed in columns 1-6 (rows 2-7): row 1's star can only
    // live in column 7.
    for (let i = 0; i < 6; i++) set(board, state, 2 + i, 1 + i, SPECIAL);
    const res = tier2Moves(state, board);
    expect(res.contradiction).toBe(false);
    expect(res.moves.get(at(board, 1, 7))).toBe(SPECIAL);
  });

  it("tier 3 forces cells constant across all line completions", () => {
    const state = emptyState(board);
    // Row 1: # # _ . . # _ (3 black, 2 white). The empties c3/c7 must take
    // {white, star}, and c3 = white would complete a white triple c3-c4-c5,
    // so every valid completion has c3 = star and c7 = white. Neither cell is
    // forced by tiers 1-2 (both have two window/cap candidates), so this is a
    // genuine enumeration deduction.
    set(board, state, 1, 1, 1);
    set(board, state, 1, 2, 1);
    set(board, state, 1, 4, 0);
    set(board, state, 1, 5, 0);
    set(board, state, 1, 6, 1);
    const res = tier3Moves(state, board);
    expect(res.contradiction).toBe(false);
    expect(res.moves.get(at(board, 1, 3))).toBe(SPECIAL);
    expect(res.moves.get(at(board, 1, 7))).toBe(0);
  });

  it("tier 3 flags a line with no valid completion", () => {
    const state = emptyState(board);
    set(board, state, 1, 1, SPECIAL);
    set(board, state, 1, 3, SPECIAL); // two stars in row 1: no completion
    const res = tier3Moves(state, board);
    expect(res.contradiction).toBe(true);
  });
});

describe("tier 4 (trial to contradiction)", () => {
  const board = buildStarBoard(7);
  // A "really" puzzle: solvable only with tier 4 in the mix.
  const puzzle = generate(board, "really", makeRng(1), { passes: 4, attempts: 20 });

  it("generates a puzzle beyond tier 3 but within tier 4", () => {
    expect(puzzle.rating).toBe("really");
    expect(puzzle.counts.tier4).toBeGreaterThanOrEqual(1);
    expect(logicSolve(puzzle.clues, board, 3).status).not.toBe("solved");
    expect(logicSolve(puzzle.clues, board, 4).status).toBe("solved");
  });

  it("is sound: every tier-4 move matches the real solution", () => {
    // Run tiers 1-3 to their fixpoint, then ask tier 4 directly.
    const { state, status } = logicSolve(puzzle.clues, board, 3);
    expect(status).toBe("stuck");
    const res = tier4Moves(state, board);
    expect(res.contradiction).toBe(false);
    expect(res.moves.size).toBeGreaterThanOrEqual(1);
    const solution = assignmentToState(board, puzzle.solution);
    for (const [idx, val] of res.moves) {
      expect(val).toBe(solution[idx]);
    }
  });

  it("powers a tier-4 hint via nextForcedMove", () => {
    const { state } = logicSolve(puzzle.clues, board, 3);
    const move = nextForcedMove(state, board, 4);
    expect(move).not.toBeNull();
    expect(move!.tier).toBe(4);
    const solution = assignmentToState(board, puzzle.solution);
    expect(move!.val).toBe(solution[move!.cellIdx]);
  });

  it("solver flags an unsolvable position before tier 4 is reached", () => {
    const state = emptyState(board);
    set(board, state, 1, 1, SPECIAL);
    set(board, state, 1, 3, SPECIAL); // row 1 can never complete
    const clues = stateToAssignment(board, state);
    expect(logicSolve(clues, board, 4).status).toBe("contradiction");
  });
});

describe("star generation", () => {
  const board = buildStarBoard(7);

  it("generates a hard s7 puzzle solvable by pure deduction", () => {
    const puzzle = generate(board, "hard", makeRng(1), { passes: 8, attempts: 10 });
    expect(puzzle.rating).toBe("hard");
    const solved = logicSolve(puzzle.clues, board, 3);
    expect(solved.status).toBe("solved");
    expect(isValidSolution(solved.state, board)).toBe(true);
    // The logic solution matches the emitted solution.
    const solution = assignmentToState(board, puzzle.solution);
    for (let i = 0; i < solved.state.length; i++) {
      expect(solved.state[i]).toBe(solution[i]);
      expect(solved.state[i]).not.toBe(EMPTY);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generate(board, "normal", makeRng(7), { passes: 6, attempts: 8 });
    const b = generate(board, "normal", makeRng(7), { passes: 6, attempts: 8 });
    expect([...a.clues.entries()]).toEqual([...b.clues.entries()]);
    expect([...a.solution.entries()]).toEqual([...b.solution.entries()]);
    expect(a.rating).toBe(b.rating);
  });
});
