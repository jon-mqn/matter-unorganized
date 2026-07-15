<script lang="ts">
  import type { Game } from "../lib/game.svelte.js";

  const { game }: { game: Game } = $props();

  function fmt(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
</script>

<div class="status">
  <span class="stat">{fmt(game.elapsed)}</span>
  <span class="sep">·</span>
  <span class="stat">{game.filled}/{game.total} filled</span>
  {#if game.showStarCounts}
    <span class="sep">·</span>
    <span class="stat stars">
      <img class="star-icon" src={game.doodles.star.url} alt="stars" />
      {game.starsPlaced}/{game.starsTotal}
    </span>
  {/if}
  {#if game.rating}
    <span class="sep">·</span>
    <span class="stat rating">{game.rating}</span>
  {/if}
</div>

{#if game.status === "solved"}
  <div class="banner win">✓ Solved in {fmt(game.elapsed)}</div>
{:else if game.status === "generating"}
  <div class="banner">Drafting a new puzzle…</div>
{:else if game.message}
  <div class="banner info">{game.message}</div>
{/if}

<style>
  .status {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    justify-content: center;
    font-family: var(--font-mono);
    color: var(--ink-soft);
    font-size: 0.95rem;
  }
  .sep {
    color: var(--grid-major);
  }
  .stars {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .star-icon {
    width: 1em;
    height: 1em;
  }
  .rating {
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--ink);
    font-weight: 700;
  }
  .banner {
    text-align: center;
    padding: 0.45rem 0.9rem;
    border: 1.6px dashed var(--ink-soft);
    border-radius: var(--sketch-radius);
    background: var(--paper);
    font-family: var(--font-hand);
    font-size: 1.05rem;
    color: var(--ink);
  }
  .banner.win {
    border-style: solid;
    border-color: var(--win);
    background: rgba(79, 154, 92, 0.16);
    color: #24512d;
    font-size: 1.25rem;
  }
  .banner.info {
    border-color: var(--margin-red);
  }
</style>
