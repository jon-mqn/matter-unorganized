# Offset-Block Unruly

Generator, solver, and difficulty rater for a non-rectangular variant of the
binary logic puzzle *Unruly*, played on "Frankengrids" of offset square blocks
that share a spine of columns. See [`offset-unruly-spec.md`](./offset-unruly-spec.md)
for the full specification; this is the TypeScript implementation of the engine.

## Rules

Each cell is white (`0`) or black (`1`). A board is valid iff every *line* (a
maximal contiguous run of cells along a row or column) satisfies:

- **R1 — No-three:** no three consecutive cells in a line share a colour.
- **R2 — Balance:** each line has an equal count of both colours.

## Setup

Requires Node 20+. This machine has no system Node; a portable build lives at
`~/.local/node`. Put it on `PATH` first:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm install
```

## Commands

```bash
npm test           # run the acceptance-test suite (spec §8) + UI-helper tests
npm run typecheck  # tsc --noEmit (engine)
npm run build      # compile the engine to dist/
npm run gen -- --difficulty hard --seed 1   # generate & print a puzzle (CLI)

npm run dev        # start the web UI dev server (Vite)
npm run build:web  # build the web UI to dist-web/
npm run check      # svelte-check the web app
```

CLI flags: `--board <token>` (default `reference`), `--difficulty easy|medium|hard`,
`--seed <int>`, `--passes <int>`. Output is deterministic for a given seed.

`--board` is either `reference` or a `-`-joined list of even square sizes, e.g.
`6-6`, `6-6-8`, `8-8`, `14-14` (see Boards below).

## Boards

A board is 1–5 square blocks (the "frankensquares"), each an even size 6–14.
Blocks share a **spine** of rows/columns so they interlock. Two arrangement
modes:

- **Canonical** (`resolveBoard("6-6-8")`): a fixed vertical staircase; `[6,6]`
  is the reference board.
- **Randomised** (`resolveBoard("6-6-8~42")`): the `~<seed>` suffix picks a
  varied layout via `arrangeBlocks(sizes, seed)` — a random mix of stacked,
  side-by-side and **overlapping** blocks. Every block is offset by an even
  amount, which keeps all row-starts one parity and col-starts one parity, so
  every maximal run has even length (R2-legal) no matter how blocks overlap.

Total cells (sum of size²) are capped at 520 to keep generation to a few
seconds; effort scales to board size (`generationBudget`). The web UI's board
configurator sets the sizes and "Shuffle shape" re-rolls the arrangement seed.

## Web UI (`web/`)

A Svelte + Vite app that runs the engine in the browser (desktop and mobile),
styled as a **graph-paper worksheet**: blue drafting grid, hand-drawn boxes, and
squares "filled in" with textured **graphite** or **red pencil** (title set in
*Architects Daughter*). Generation runs in a **Web Worker** so the UI stays
responsive. Features: tap-to-cycle cells (empty → first colour → other → empty),
live rule-violation highlighting (marked in red pen), hints (next forced
deduction, labelled by tactic tier), a timer with win detection, undo/redo, a
**board configurator** (choose the number and sizes of squares), **Show
solution** (read-only reveal), a configurable **first-tap pencil** (graphite or
red, remembered across sessions), **frankensquare regions** (each source block
is outlined behind the grid and shaded green once all its cells match the
solution), and shareable seed URLs
(`#<sizes>/<difficulty>/<seed>`, e.g. `#6-6-8/hard/12345`, regenerates the exact
puzzle).

The app imports the engine via the `@engine` Vite alias (repo-root `src/`); no
engine code is duplicated. Board rendering uses CSS Grid, placing each cell at
its `grid-row`/`grid-column` so the offset blocks stagger naturally.

## Library

`src/index.ts` re-exports the public API. Key entry points:

| Function | Purpose | Spec |
|----------|---------|------|
| `buildBoard(id, blockDefs)` | Geometry + lines + indices; validates even-length lines | §3.2 |
| `referenceBoardBuild()` | The v1 reference board (two 6×6 offset by 3) | §1.1 |
| `buildStackedBoard(sizes)` / `resolveBoard(token)` | Build a vertical Frankengrid from square sizes | — |
| `stackedBlockDefs(sizes)` / `validateSizes(sizes)` | Block layout + size-rule validation | — |
| `legal` / `isValidSolution` | Partial-legality and full-validity checks | §4.1 |
| `countSolutions(clues, board, cap)` | Early-exit solution counter | §4.2 |
| `randomSolution(board, rng)` | Seeded random valid fill | §4.3 |
| `tier1/2/3Moves`, `logicSolve`, `rate` | Graded no-guessing solver + rater | §4.4/4.5 |
| `reduceUnique`, `reduceLogic` | Multi-pass clue reducers | §4.6 |
| `generate(board, difficulty, rng, opts)` | End-to-end puzzle pipeline | §5 |
| `collectViolations(state, board)` | Cells on a rule-breaking line (UI highlighting) | — |
| `nextForcedMove(state, board, maxTier)` | Next forced move + tier (UI hints) | — |

## Layout

```
src/            engine (browser-safe except cli.ts)
  types.ts      board.ts / boards.ts   rng.ts / state.ts
  rules.ts      solver.ts              tactics.ts / logic.ts
  reduce.ts     generate.ts            render.ts / cli.ts / index.ts
tests/          fixtures.ts + one *.test.ts per acceptance test (§8) + helper/url tests
web/            Svelte + Vite UI
  index.html    vite.config.ts / svelte.config.js / tsconfig.json
  src/
    App.svelte  main.ts   styles/app.css
    lib/        engine.ts  game.svelte.ts  generate.worker.ts  url.ts
    components/ Board.svelte  Controls.svelte  Config.svelte  StatusBar.svelte
```
