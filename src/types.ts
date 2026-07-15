/**
 * Core data model for Offset-Block Unruly (§3 of the spec).
 *
 * Cells are 1-indexed internally to match the reference fixtures in §9.
 * A cell's colour is 0 (white) or 1 (black). Board geometry is defined by a
 * union of rectangular blocks; lines are derived generically (§3.2).
 */

/** A colour value in a completed cell. 2 is the star of the star variant. */
export type Colour = 0 | 1 | 2;

/** The third cell state on star boards: exactly one per line. */
export const SPECIAL = 2;

/** A single grid cell, 1-indexed. */
export interface Cell {
  r: number;
  c: number;
}

/** Stable string key for a cell, used for map lookups and the public API. */
export type CellId = string;

/** Definition of one rectangular block (inclusive bounds, 1-indexed). */
export interface BlockDef {
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
}

/**
 * A maximal contiguous run of cells along one axis (§3.2). Stored as ordered
 * cell *order indices* (indices into Board.order), plus the axis for debugging.
 */
export interface Line {
  axis: "row" | "col";
  /** Fixed index of the row (for row-lines) or col (for col-lines). */
  index: number;
  /** Cell order indices, in traversal order along the line. */
  cells: number[];
  length: number;
  /**
   * Required count per colour in the completed line (R2, generalised):
   * [(L-1)/2, (L-1)/2, 1].
   */
  targets: number[];
}

/**
 * Immutable board geometry and precomputed indices (§3.3). `order` and `cells`
 * are the same list (row-major); a cell's "order index" is its position here.
 */
export interface Board {
  id: string;
  /** Cells in row-major traversal order. */
  order: Cell[];
  /** cellId -> order index. */
  cellIndex: Map<CellId, number>;
  /** All lines (row-lines and col-lines) with length >= 2. */
  lines: Line[];
  /** Per order index: the line indices containing that cell (>= 1 each). */
  linesOf: number[][];
  /** The source square blocks (1-indexed rects), for rendering block regions. */
  blocks: BlockDef[];
  /** Number of cell states: 3 (two pencil colours plus the star). */
  colours: number;
}

/**
 * A working assignment. Indexed by cell order index; values are 0, 1, or
 * EMPTY (-1). Cheap to clone for backtracking.
 */
export type State = Int8Array;

export const EMPTY = -1;

/** A partial or total assignment exposed at the public API boundary. */
export type Assignment = Map<CellId, Colour>;

export type Difficulty = "normal" | "hard" | "really";

export type Rating = "normal" | "hard" | "really" | "unfair";

export type Status = "solved" | "stuck" | "contradiction";

/** Per-tier invocation counts from the logic solver (§4.5). */
export interface TierCounts {
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
}

export interface LogicResult {
  state: State;
  status: Status;
  counts: TierCounts;
  /** Highest tier that produced at least one move (0 if none). */
  topTier: number;
}

export interface RateResult {
  rating: Rating;
  topTier: number;
  counts: TierCounts;
}

export interface Puzzle {
  boardId: string;
  clues: Assignment;
  solution: Assignment;
  rating: Rating;
  counts: TierCounts;
}

/** Seedable RNG returning a float in [0, 1). */
export type Rng = () => number;

export function cellId(r: number, c: number): CellId {
  return `${r},${c}`;
}
