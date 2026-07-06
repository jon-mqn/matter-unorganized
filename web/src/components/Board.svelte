<script lang="ts">
  import { EMPTY } from "../lib/engine.js";
  import type { Game } from "../lib/game.svelte.js";

  const { game }: { game: Game } = $props();

  const maxRow = $derived(Math.max(...game.board.order.map((c) => c.r)));
  const maxCol = $derived(Math.max(...game.board.order.map((c) => c.c)));

  // Coloured-pencil hue per frankensquare, so each piece is distinct.
  const BLOCK_COLORS = ["#3f6fa3", "#4f9a5c", "#cf8a2e", "#8a5aa8", "#3a9a95"];

  function label(v: number): string {
    return v === 1 ? "graphite" : v === 0 ? "red" : v === 2 ? "star" : "empty";
  }
</script>

<div class="board-scroll">
  <div
    class="board"
    class:revealed={game.revealed}
    style="--rows:{maxRow}; --cols:{maxCol}; --cell: min(42px, calc((min(100vw, 620px) - 3rem) / {maxCol} - var(--gap)));"
    role="grid"
    aria-label="Puzzle board"
  >
    {#each game.board.blocks as blk, bi (bi)}
      <div
        class="block"
        class:done={game.blocksDone[bi]}
        aria-hidden="true"
        style="grid-row:{blk.rowStart} / {blk.rowEnd + 1}; grid-column:{blk.colStart} / {blk.colEnd + 1}; --bc:{BLOCK_COLORS[bi % BLOCK_COLORS.length]};"
      ></div>
    {/each}
    {#each game.board.order as cell, i (i)}
      {@const v = (game.revealed ? game.solution[i] : game.player[i]) ?? EMPTY}
      <button
        class="cell {label(v)}"
        class:clue={game.clueSet.has(i)}
        class:violation={!game.revealed && game.violations.has(i)}
        class:hint={!game.revealed && game.hintCell === i}
        style="grid-row:{cell.r}; grid-column:{cell.c};"
        aria-label={`row ${cell.r} column ${cell.c}: ${label(v)}`}
        onclick={() => game.cycle(i)}
      ></button>
    {/each}
  </div>
</div>

<style>
  /* The board always fits the width (cells shrink); just centre it. */
  .board-scroll {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .board {
    display: grid;
    grid-template-columns: repeat(var(--cols), var(--cell));
    grid-template-rows: repeat(var(--rows), var(--cell));
    gap: var(--gap);
    touch-action: manipulation;
  }

  /* Sketched outline of each source frankensquare, behind the cells. Fills with
     a soft green pencil wash once all its cells match the solution. Cells are
     position:relative, so they always paint above these static blocks. */
  /* Each frankensquare gets its own coloured-pencil outline (--bc). */
  .block {
    margin: -2.5px;
    border: 1.7px solid color-mix(in srgb, var(--bc) 58%, var(--paper));
    border-radius: 20px 9px 17px 11px / 11px 17px 9px 20px;
    pointer-events: none;
  }
  /* Completed block: a cross-hatch "shaded in" by hand in the piece's colour. */
  .block.done {
    border-color: var(--bc);
    border-width: 2px;
    background:
      repeating-linear-gradient(38deg, color-mix(in srgb, var(--bc) 34%, transparent) 0 1.5px, transparent 1.5px 7px),
      repeating-linear-gradient(-42deg, color-mix(in srgb, var(--bc) 22%, transparent) 0 1px, transparent 1px 8px),
      color-mix(in srgb, var(--bc) 11%, transparent);
  }

  /* Hand-ruled puzzle boxes drawn on the graph paper. */
  .cell {
    position: relative;
    width: var(--cell);
    height: var(--cell);
    min-height: 0; /* override the global button touch-target min-height */
    padding: 0;
    border: 1.3px solid var(--ink-soft);
    border-radius: var(--cell-radius);
    background: transparent;
    cursor: pointer;
    box-shadow: none;
    transition: none;
  }
  /* Cells are fixed in the grid — cancel the global button press/hover motion. */
  .board .cell:hover,
  .board .cell:active {
    transform: none;
    background: transparent;
  }
  .board .cell:not(.clue).empty:hover {
    background: rgba(44, 49, 58, 0.06);
  }

  /* The "colored-in" pencil fill: textured, inset, faintly rotated by hand. */
  .cell::before {
    content: "";
    position: absolute;
    inset: 2px;
    border-radius: var(--cell-radius);
    /* Static PNG grain + hatch composited normally over the fill — no runtime
       SVG filter or blend mode, so filling a cell is a cheap paint. */
    background:
      var(--pencil-grain),
      repeating-linear-gradient(40deg, rgba(0, 0, 0, 0.14) 0 1px, transparent 1px 5px),
      var(--fill, transparent);
    background-size: 64px 64px, auto, auto;
    opacity: 0;
  }
  .cell.graphite::before {
    --fill: var(--graphite);
    opacity: 1;
  }
  .cell.red::before {
    --fill: var(--red-pencil);
    opacity: 1;
  }
  /* Subtle per-cell rotation so no two fills line up perfectly. */
  .cell:nth-child(2n)::before {
    transform: rotate(0.8deg);
  }
  .cell:nth-child(3n)::before {
    transform: rotate(-0.9deg);
  }
  .cell:nth-child(5n)::before {
    transform: rotate(0.5deg);
  }

  /* The star variant's third state: a blue-pencil star sketched in the box. */
  .cell.star::after {
    content: "✶";
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-family: var(--font-hand);
    font-size: calc(var(--cell) * 0.68);
    line-height: 1;
    color: #3f6fa3;
    text-shadow: 0.5px 0.5px 0 rgba(63, 111, 163, 0.45);
    transform: rotate(-6deg);
    pointer-events: none;
  }
  .cell:nth-child(2n).star::after {
    transform: rotate(5deg);
  }
  .cell:nth-child(3n).star::after {
    transform: rotate(-3deg);
  }

  /* Given clues are "printed" — a heavier ink box. */
  .cell.clue {
    border-color: var(--ink);
    border-width: 2px;
    cursor: default;
  }

  /* Errors marked in red pen; hints highlighted like a marker swipe. */
  .cell.violation {
    outline: 2.5px dashed var(--correction);
    outline-offset: 2px;
    z-index: 1;
  }
  .cell.hint {
    box-shadow: 0 0 0 4px rgba(240, 180, 0, 0.55);
    z-index: 2;
  }

  .board.revealed {
    opacity: 0.92;
  }
  .board.revealed .cell {
    cursor: default;
  }
</style>
