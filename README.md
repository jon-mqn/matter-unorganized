# Star Unruly

Generator, solver, and difficulty rater for a star variant of the binary logic
puzzle *Unruly*: 1-star Star Battle layered under Unruly's no-three/balance
rules. The engine grew out of the offset-block classic variant specified in
[`offset-unruly-spec.md`](./offset-unruly-spec.md); after playtesting, the star
variant is the game and the classic machinery has been removed.

## Rules

Boards are odd single squares (7, 9, 11 or 15). Each cell is white (`0`),
black (`1`), or a **star** (`2`). A board is valid iff every row and column
satisfies:

- **R1 — No-three:** no three consecutive cells share a colour (a star
  interrupts a run).
- **R2 — Balance:** each line holds (n−1)/2 of each colour plus **exactly one
  star** — so the stars form a permutation matrix.

Internally R2 is a per-line target count per cell state (`line.targets`), and
the solver tiers are candidate-elimination (a `[X,X,_]` window *eliminates* X),
plus a hidden single for the star ("only one cell in this line can still hold
it"). Board tokens: `s7 | s9 | s11 | s15`. See [`star-eval.md`](./star-eval.md)
for the difficulty study (`npm run eval` regenerates it).

## Difficulty

Four solver tiers grade puzzles into three bands:

| Band | Max tier | Texture |
|------|----------|---------|
| `normal` | 2 — window + count eliminations, star hidden single | counting |
| `hard` | 3 — full line enumeration (per-line DP) | completions |
| `really` | 4 — trial to contradiction (guess-free "what-if") | dead ends |

Tier 4 tentatively places a candidate and cascades tiers 1–2 to a fixpoint; a
candidate that reaches a contradiction is eliminated. Puzzles stay fully
deducible — hints work at every band. "Really?" generation is expensive, so
the web UI caps it at 11×11 (`REALLY_MAX_SIZE`).

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
npm run gen -- --difficulty really --seed 1  # generate & print a puzzle (CLI)

npm run dev        # start the web UI dev server (Vite)
npm run build:web  # build the web UI to dist-web/
npm run check      # svelte-check the web app
```

CLI flags: `--board <token>` (default `s7`), `--difficulty normal|hard|really`,
`--seed <int>`, `--passes <int>`. Output is deterministic for a given seed.

## Generation

`randomSolution` places the stars first as an explicitly uniform permutation
(one `shuffle` of the columns), then backtrack-fills the two colours. The stars
must not be left to the backtracker: a depth-first fill returns the first
completion it finds, which piles stars onto the main diagonal. `generate` then
reduces clues logic-aware to the band's max tier and retries until the rating
lands exactly on band; effort scales with board size and difficulty
(`generationBudget`).

## Web UI (`web/`)

A Svelte + Vite app that runs the engine in the browser (desktop and mobile),
styled as a **graph-paper worksheet**: blue drafting grid, hand-drawn boxes,
and squares "filled in" with textured **graphite** or **red pencil** (title set
in *Architects Daughter*). Generation runs in a **Web Worker** so the UI stays
responsive.

Features: tap-to-cycle cells (empty → first colour → other → ✶ → empty),
**long-press or right-click** to toggle the star directly, live rule-violation
highlighting (marked in red pen), **per-line star marks** in the board margins
plus a star counter (toggleable), hints (next forced deduction, labelled by
tactic tier), a timer with win detection, undo/redo, **Show solution**
(read-only reveal), and shareable seed URLs (`#s7/hard/12345` regenerates the
exact puzzle; legacy `easy`/`medium` links load as `normal`).

The **Settings** dialog holds board size, difficulty, the first-tap pencil
(graphite or red), and the star-count / instant-validation toggles — all
remembered in `localStorage`.

The app imports the engine via the `@engine` Vite alias (repo-root `src/`); no
engine code is duplicated. Board rendering uses CSS Grid, placing each cell at
its `grid-row`/`grid-column`.

## Library

`src/index.ts` re-exports the public API. Key entry points:

| Function | Purpose | Spec |
|----------|---------|------|
| `buildBoard(id, blockDefs)` | Geometry + lines + indices; validates odd-length lines | §3.2 |
| `buildStarBoard(size)` / `resolveBoard(token)` | Build (and cache) a star board | — |
| `legal` / `isValidSolution` | Partial-legality and full-validity checks | §4.1 |
| `countSolutions(clues, board, cap)` | Early-exit solution counter | §4.2 |
| `randomSolution(board, rng)` | Seeded uniform-star random fill | §4.3 |
| `tier1/2/3/4Moves`, `logicSolve`, `rate` | Graded no-guessing solver + rater | §4.4/4.5 |
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
    components/ Board.svelte  Controls.svelte  Settings.svelte  StatusBar.svelte
```

## Credits

Tile artwork (monsters and stars) in `assets/` is from the
[mega-doodles-pack](https://github.com/MariaLetta/mega-doodles-pack) by
[Maria Letta](https://github.com/MariaLetta), used under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
See `assets/ATTRIBUTION.md`.
