# Offset-Block Unruly — Implementation Requirements Specification

**Version:** 1.0
**Status:** Ready for implementation
**Purpose:** A self-contained spec for building a generator, solver, and difficulty rater for a non-rectangular variant of the binary logic puzzle *Unruly*, played on a board composed of offset square blocks that share a band of columns (a "spine").

---

## 1. Concept

Standard Unruly is a 2-colour grid puzzle. This variant keeps the two classic rules but replaces the rectangular board with a **Frankengrid**: two or more square sub-grids offset so they overlap on a shared set of columns (and/or rows). The reference board for v1 is two 6×6 blocks offset by 3 columns, producing three middle columns of height 12.

The shared columns ("the spine") couple the blocks into a single interlocked puzzle rather than two independent grids. This coupling is the design centrepiece and the source of difficulty.

### 1.1 Reference board (v1 target)

```
      c1 c2 c3 c4 c5 c6 c7 c8 c9
 r1   [        TOP         ]
 r2   [   block: rows 1-6  ]
 r3   [   cols 1-6         ]
 r4   [                    ]
 r5   [                    ]
 r6   [                    ]
 r7            [       BOTTOM        ]
 r8            [  block: rows 7-12   ]
 r9            [  cols 4-9           ]
 r10           [                     ]
 r11           [                     ]
 r12           [                     ]
```

- Cells = {(r,c) : 1≤r≤6, 1≤c≤6} ∪ {(r,c) : 7≤r≤12, 4≤c≤9}. Total 72 cells.
- Columns 4–6 are length-12 lines (the spine). All other columns are length 6.
- All 12 rows are length 6.

---

## 2. Rules

A completed board assigns each cell one of two colours (encode as 0 = white, 1 = black).

A board is **valid** iff every *line* satisfies both:

- **R1 — No-three:** no three consecutive cells in a line share a colour.
- **R2 — Balance:** each line contains an equal count of both colours (exactly L/2 each, where L is line length).

A **line** is a *maximal contiguous run* of cells along one axis (a full row, or a full vertical column segment). See §3.2 for the precise definition, which is the crux of generalising beyond rectangles.

### 2.1 Hard invariant (board legality)

Every line length **must be even** (else R2 is unsatisfiable) and **should be ≥ 6** (else R1 never fires and that line adds no constraint). A board definition that violates the even-length rule on any line must be rejected at load time with a clear error.

### 2.2 Generalisation hooks (optional, document but default-off)

- **3-colour / k-colour mode:** R2 becomes "counts differ by at most 1" (collapses to exactly-equal when L is divisible by k). R1 stays "no three consecutive same." Only meaningful for lines of length ≥ 3k; on short lines R1 goes inert (a known trap). Not required for v1.
- These hooks should be isolated behind the line-evaluation functions so the core engine is colour-count-agnostic.

---

## 3. Data Model

### 3.1 Cell

- A cell is an `(row, col)` integer pair (1-indexed in examples; 0-indexing is fine internally).
- The set of valid cells is defined by the **board definition**, not assumed rectangular.

### 3.2 Board definition

The board is the input that defines geometry. Represent it as:

- `cells`: the set/list of valid `(r,c)` coordinates.
- `lines`: a list of lines, where each line is an **ordered** list of cells.

**Line construction algorithm (must be implemented generically, not hard-coded):**

1. For each row index r, collect all cells in that row sorted by column. Split into maximal runs of horizontally-adjacent cells (a gap in column numbers starts a new line). Each run of length ≥ 2 is a row-line.
2. For each column index c, collect all cells in that column sorted by row. Split into maximal runs of vertically-adjacent cells. Each run is a column-line.
3. Discard any run of length < 2 (a singleton cannot carry constraints).
4. **Validate:** assert every resulting line has even length. Reject the board otherwise.

This algorithm makes the engine work for *any* union of blocks — stacked, offset, pinwheel, with or without true cell-overlap — with no special-casing. The reference board is just one input to it.

### 3.3 Indices (build once, reuse)

- `order`: cells in a fixed traversal order (row-major is fine) — used by the backtracking solver.
- `lines_of[cell]`: list of line indices that contain the cell (each interior cell belongs to exactly one row-line and one column-line; cells in true block-overlaps may belong to more — the engine must handle ≥1 generically).

### 3.4 Puzzle vs. solution

- A **solution** is a total assignment `cell → {0,1}` that is valid.
- A **puzzle** (clue set) is a partial assignment `cell → {0,1}` (the givens). Empty cells are to be solved.

---

## 4. Core Algorithms

### 4.1 Validity / partial-legality check

`legal(state, cell, val)` → bool. Tentatively place `val` at `cell`; for each line in `lines_of[cell]`, verify:

- colour counts do not exceed L/2 for either colour (R2 feasibility), and
- no completed triple of equal colour exists in any 3-window touching `cell` (R1).

Used as the pruning predicate inside backtracking. Must be O(lines touching the cell), not O(whole board).

### 4.2 Backtracking solver / solution counter

`count_solutions(clues, cap)` → int.

- Assign cells in `order`, skipping givens.
- At each free cell, try both colours; recurse only if `legal` holds.
- Count completed assignments; **stop early once `cap` solutions are found** (use `cap = 2` for uniqueness testing — we only need to know "exactly 1" vs "≥ 2").

Used for: (a) generating a random valid fill, and (b) uniqueness testing.

### 4.3 Random valid fill (solution generator)

Run the backtracking solver with an **empty clue set** and **randomised colour order** at each cell (seedable RNG). The first completed assignment is a uniformly-ish random valid solution. This is the seed for puzzle creation.

### 4.4 Logic solver (no-guessing) — graded tactics

This is the human-solvability engine. It applies deduction rules in increasing difficulty tiers, never guessing. Each tactic scans the current partial `state` and returns a set of forced `cell → val` moves. Apply the **lowest** tier that produces at least one new move; loop to fixpoint.

**Tier 1 — Local no-three forcing** (within any line, for each 3-window of cells at positions i,i+1,i+2):
- `[X, X, _] → set pos i+2 = ¬X`
- `[_, X, X] → set pos i = ¬X`
- `[X, _, X] → set pos i+1 = ¬X`

**Tier 2 — Balance fill** (per line): if a line already contains L/2 of one colour, set every remaining empty cell in that line to the other colour.

**Tier 3 — Line enumeration** (per line): enumerate every completion of the line's empty cells consistent with **both** R1 and R2 given current knowns; if a cell takes the same value in all completions, force it. (Tier 3 subsumes Tiers 1–2 but is invoked only when they stall; keeping them separate is what lets us *measure* difficulty.) For a length-12 spine this enumerates at most C(12,6)=924 candidates — cheap.

**Solver outcomes:**
- **Solved:** all cells filled, no contradiction → puzzle is solvable by pure deduction.
- **Stuck:** no tier produces a move and cells remain empty → puzzle requires guessing (beyond no-guessing tier set).
- **Contradiction:** some line has zero valid completions → puzzle is broken (should never happen for puzzles derived from a real solution).

### 4.5 Difficulty rater

Run the graded logic solver, recording the **highest tier invoked** and a **count of invocations per tier**. Rating:

| Rating | Definition |
|--------|------------|
| **Easy** | Solvable using Tier 1 only. |
| **Medium** | Requires Tier 2; never needs Tier 3. |
| **Hard** | Requires Tier 3 at least once. |
| **Unfair / reject** | Logic solver gets stuck (needs guessing). Not shippable as a deduction puzzle. |

Secondary difficulty signal within a band: number of Tier-2/Tier-3 invocations and clue count (fewer clues → harder). Empirically (reference board): Easy ≈ 22 clues, Medium ≈ 15, Hard ≈ 13–14.

### 4.6 Clue reducer

Two modes, both starting from a full valid solution and removing givens one at a time in randomised order:

- **Uniqueness-minimal:** remove a clue only if `count_solutions(clues, cap=2) == 1` still holds. Produces a puzzle with a unique solution; may still require guessing to solve by hand.
- **Logic-aware (recommended for shipping):** remove a clue only if the **graded logic solver still fully solves** the puzzle *and* its rating stays within the target band (pass `max_tier` as a parameter). Guarantees human-solvable-by-deduction at the desired difficulty. (Any logic-solvable puzzle is automatically unique, so this also guarantees uniqueness.)

Because greedy reduction is order-dependent, run **N independent passes** (different seeds) and keep the result with the fewest clues (or the one whose rating best matches the target). N ≈ 25–40 is sufficient for the reference board.

---

## 5. Generation Pipeline

End-to-end "give me a puzzle at difficulty D":

1. **Fill:** generate a random valid solution (§4.3).
2. **Reduce:** run logic-aware reduction (§4.6) with `max_tier` set per the target band (Easy→1, Medium→2, Hard→3), across N seeded passes.
3. **Rate:** confirm the kept clue set rates exactly at the target band (§4.5). If it under/over-shoots, discard and retry from step 1 (or accept nearest band).
4. **Emit:** output the clue set, the solution, the difficulty rating, and the per-tier invocation counts.

Optionally cache generated puzzles keyed by `(board_id, difficulty)`.

---

## 6. Function Inventory (suggested signatures)

```
build_board(block_defs) -> Board          # §3.2: cells, lines, indices; validates even-length
legal(state, cell, val, board) -> bool                              # §4.1
count_solutions(clues, board, cap=2) -> int                         # §4.2
random_solution(board, rng) -> dict                                 # §4.3
tier1_moves(state, board) -> dict                                   # §4.4
tier2_moves(state, board) -> dict                                   # §4.4
tier3_moves(state, board) -> dict                                   # §4.4
logic_solve(clues, board, max_tier=3) -> (state, status, counts)    # §4.4/4.5
rate(clues, board) -> (rating, top_tier, counts)                    # §4.5
reduce_unique(solution, board, rng) -> clues                        # §4.6
reduce_logic(solution, board, rng, max_tier) -> clues               # §4.6
generate(board, difficulty, n_passes, rng) -> Puzzle                # §5
```

`Board` bundles `cells`, `lines`, `order`, `lines_of`. `Puzzle` bundles `clues`, `solution`, `rating`, `counts`.

---

## 7. Invariants & Edge Cases

- **Even line length:** enforced at board build (§2.1). Single most important precondition.
- **Line definition is maximal-run, not "whole row/column":** if a future board has a gap in a column, that column is two independent lines with independent balance counts. Do not assume one line per row/column index.
- **True overlap cells:** if blocks are offset in both axes so a region belongs to two blocks, those cells legitimately sit in two row-lines and/or two column-lines. `lines_of[cell]` having length > 2 is valid; engine must not assume exactly 2.
- **RNG seeding:** every randomised step (fill, reduction order, multi-pass) must accept an explicit seed for reproducibility.
- **Early-exit counting:** never enumerate all solutions; cap at 2. Full enumeration on sparse boards is exponential.
- **Greedy minima are jumpy:** a single reduction pass is not globally minimal; always multi-pass.
- **Rating monotonicity assumption:** allowing harder tactics permits fewer clues. Use this as a sanity check on the rater, not a guarantee — verify empirically per board.

---

## 8. Acceptance Tests

1. **Board legality:** build the reference board; assert 72 cells, all lines even, spine columns length 12, all others length 6.
2. **Validity checker:** a known-good solution passes; flipping any single cell that creates a triple or imbalance fails on the expected line.
3. **Solution counter:** on a near-complete puzzle with a forced last cell, returns 1; on the empty board returns ≥ 2 (cap hit).
4. **Logic solver soundness:** every move it makes agrees with the seed solution; it never fills a cell that has two legal completions under full search.
5. **Logic solver completeness band:** the reference 15-clue uniqueness-minimal puzzle is solved by the logic solver and rates **Hard** with Tier-3 used ≥ 1 time. (Verified during design.)
6. **Reducer correctness:** uniqueness-minimal output satisfies `count_solutions == 1`; logic-aware output is fully solved by `logic_solve` at or under its `max_tier`.
7. **Generator banding:** generating at Easy/Medium/Hard yields puzzles rating exactly at the requested band across repeated seeds; observed clue counts roughly 22 / 15 / 13–14 on the reference board.
8. **Determinism:** same seed → identical puzzle.

---

## 9. Reference Data (for test fixtures)

A verified valid solution to the reference board (rows top→bottom; top block cols 1–6, bottom block cols 4–9; `#`=black/1, `.`=white/0):

```
      1 2 3 4 5 6 7 8 9
 r1   . # . # # .
 r2   . # # . # .
 r3   # . # . . #
 r4   # . . # # .
 r5   . # # . . #
 r6   # . . # # .
 r7         # . . # . #
 r8         . . # # . #
 r9         . # # . # .
 r10        # # . . # .
 r11        . . # # . #
 r12        # . # . # .
```

A verified deduction-only puzzle (13 clues, rates Hard) for the same solution:

```
      1 2 3 4 5 6 7 8 9
 r1   · · · · · .
 r2   · · # · # ·
 r3   # · # · · ·
 r4   · . · · · ·
 r5   · · # · · ·
 r6   · . · · # ·
 r7         · · . · · #
 r8         · · · · · ·
 r9         · # · · · ·
 r10        · · · . · ·
 r11        · · · · · ·
 r12        · · · · · ·
```

(`·` = empty/to-solve. This is one valid fixture; your generator will produce others.)

---

## 10. Out of Scope for v1 (future work)

- k-colour mode (§2.2 hooks present but off).
- Non-square or hex blocks.
- A 4th "expert" tactic tier (cross-line interaction) for boards where Tier 3 alone leaves puzzles stuck.
- UI / rendering / input handling — this spec covers the engine only.
- Performance tuning beyond early-exit counting (reference board solves instantly; larger Frankengrids may need bitmask line states or memoised line enumeration).
