<script lang="ts">
  import { EMPTY } from "../lib/engine.js";
  import type { Game } from "../lib/game.svelte.js";

  const { game }: { game: Game } = $props();

  const maxRow = $derived(Math.max(...game.board.order.map((c) => c.r)));
  const maxCol = $derived(Math.max(...game.board.order.map((c) => c.c)));

  // Coloured-pencil hue per frankensquare, so each piece is distinct.
  const BLOCK_COLORS = ["#3f6fa3", "#4f9a5c", "#cf8a2e", "#8a5aa8", "#3a9a95"];

  // CSS class per cell value (the graphite/red names are historical).
  function cls(v: number): string {
    return v === 1 ? "graphite" : v === 0 ? "red" : v === 2 ? "star" : "empty";
  }
  // Spoken name per cell value: the game's doodle names.
  function label(v: number): string {
    return v === 1
      ? game.doodles.black.name
      : v === 0
        ? game.doodles.red.name
        : v === 2
          ? game.doodles.star.name
          : "empty";
  }

  // Long-press = toggle the star directly (a shortcut past the tap cycle).
  // A fired press suppresses the synthetic click that follows it, and the
  // contextmenu Android raises for the same hold.
  const HOLD_MS = 475;
  const SLOP_PX = 8;
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let pressX = 0;
  let pressY = 0;
  let suppressClick = false;

  function pressStart(i: number, e: PointerEvent) {
    pressCancel();
    suppressClick = false;
    pressX = e.clientX;
    pressY = e.clientY;
    pressTimer = setTimeout(() => {
      pressTimer = null;
      suppressClick = true;
      game.toggleStar(i);
    }, HOLD_MS);
  }
  function pressMove(e: PointerEvent) {
    if (pressTimer !== null && Math.hypot(e.clientX - pressX, e.clientY - pressY) > SLOP_PX) {
      pressCancel();
    }
  }
  function pressCancel() {
    if (pressTimer !== null) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }
  function cellClick(i: number) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    game.cycle(i);
  }
  function cellContextMenu(i: number, e: MouseEvent) {
    e.preventDefault();
    pressCancel();
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    game.toggleStar(i);
  }
</script>

<div class="board-scroll">
  <div
    class="board"
    class:revealed={game.revealed}
    class:rails={game.showStarCounts}
    style="--rows:{maxRow}; --cols:{maxCol}; --cell: min(42px, calc((min(100vw, 620px) - 3rem - var(--rail-w, 0px)) / {maxCol} - var(--gap))); --tile-black:url('{game.doodles.black.url}'); --tile-red:url('{game.doodles.red.url}'); --tile-star:url('{game.doodles.star.url}');"
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
        class="cell {cls(v)}"
        class:clue={game.clueSet.has(i)}
        class:violation={!game.revealed && game.violations.has(i)}
        class:hint={!game.revealed && game.hintCell === i}
        style="grid-row:{cell.r}; grid-column:{cell.c};"
        aria-label={`row ${cell.r} column ${cell.c}: ${label(v)}`}
        onclick={() => cellClick(i)}
        onpointerdown={(e) => pressStart(i, e)}
        onpointermove={pressMove}
        onpointerup={pressCancel}
        onpointercancel={pressCancel}
        onpointerleave={pressCancel}
        oncontextmenu={(e) => cellContextMenu(i, e)}
      ></button>
    {/each}
    {#if game.showStarCounts}
      {#each game.rowStarCounts as n, r (r)}
        <span
          class="mark"
          class:done={n === 1}
          class:over={n > 1}
          style="grid-row:{r + 1}; grid-column:{maxCol + 1};"
          role="img"
          aria-label={`row ${r + 1}: ${n} of 1 stars`}
        ></span>
      {/each}
      {#each game.colStarCounts as n, c (c)}
        <span
          class="mark"
          class:done={n === 1}
          class:over={n > 1}
          style="grid-row:{maxRow + 1}; grid-column:{c + 1};"
          role="img"
          aria-label={`column ${c + 1}: ${n} of 1 stars`}
        ></span>
      {/each}
    {/if}
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
  /* Extra margin tracks for the per-line star marks. */
  .board.rails {
    --rail-w: 20px;
    grid-template-columns: repeat(var(--cols), var(--cell)) var(--rail-w);
    grid-template-rows: repeat(var(--rows), var(--cell)) var(--rail-w);
  }

  /* Per-line star tally, jotted in the margin: pending, done (dim), or over-
     placed (circled in red pen). A gentle count reminder without validation. */
  .mark {
    position: relative;
    width: 17px;
    height: 17px;
    place-self: center;
    background: var(--tile-star) center / contain no-repeat;
    pointer-events: none;
  }
  .mark.done {
    opacity: 0.25;
  }
  .mark.over::after {
    content: "";
    position: absolute;
    inset: -3px;
    border: 2px solid var(--correction);
    border-radius: 60% 48% 55% 45% / 50% 62% 45% 55%;
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
    /* Long-press must not trigger text selection or the iOS callout. */
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
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

  /* The tile artwork: the game's doodle stamped in the box, faintly rotated by
     hand. All cells share the same 2–3 image URLs, so the browser decodes each
     doodle once per size and stamping a cell stays a cheap paint. */
  .cell::before {
    content: "";
    position: absolute;
    inset: 2px;
    background: var(--img, none) center / contain no-repeat;
  }
  .cell.graphite::before {
    --img: var(--tile-black);
  }
  .cell.red::before {
    --img: var(--tile-red);
  }
  .cell.star::before {
    --img: var(--tile-star);
  }
  /* Subtle per-cell rotation so no two doodles line up perfectly. */
  .cell:nth-child(2n)::before {
    transform: rotate(4deg);
  }
  .cell:nth-child(3n)::before {
    transform: rotate(-5deg);
  }
  .cell:nth-child(5n)::before {
    transform: rotate(2.5deg);
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
