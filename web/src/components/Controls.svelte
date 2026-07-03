<script lang="ts">
  import type { Difficulty } from "../lib/engine.js";
  import type { Game } from "../lib/game.svelte.js";

  const { game }: { game: Game } = $props();
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  let copied = $state(false);

  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      game.message = "Copy failed — the shareable link is in the address bar.";
    }
  }
</script>

<div class="controls">
  <label class="difficulty">
    Difficulty
    <select
      value={game.difficulty}
      onchange={(e) => game.newPuzzle(e.currentTarget.value as Difficulty)}
    >
      {#each difficulties as d}
        <option value={d}>{d}</option>
      {/each}
    </select>
  </label>

  <button onclick={() => game.newPuzzle()}>New puzzle</button>
  <button onclick={() => game.hint()} disabled={game.status !== "playing" || game.revealed}>
    Hint
  </button>
  <button onclick={() => game.undo()} disabled={!game.canUndo || game.revealed}>Undo</button>
  <button onclick={() => game.redo()} disabled={!game.canRedo || game.revealed}>Redo</button>
  <button
    class:active={game.revealed}
    onclick={() => game.toggleSolution()}
    disabled={game.status === "generating"}
  >
    {game.revealed ? "Hide solution" : "Show solution"}
  </button>
  <button onclick={share}>{copied ? "Copied!" : "Share"}</button>

  <span class="firsttap" title="Pencil used on the first tap of a cell">
    First tap
    <button
      class="swatch graphite"
      class:sel={game.firstColor === 1}
      aria-label="graphite first"
      onclick={() => game.setFirstColor(1)}
    ></button>
    <button
      class="swatch red"
      class:sel={game.firstColor === 0}
      aria-label="red pencil first"
      onclick={() => game.setFirstColor(0)}
    ></button>
  </span>
</div>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
  }
  .difficulty {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-hand);
    font-size: 1rem;
    color: var(--ink-soft);
  }
  select {
    text-transform: capitalize;
  }
  button.active {
    background: var(--hint);
    color: var(--ink);
  }
  .firsttap {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-hand);
    font-size: 1rem;
    color: var(--ink-soft);
  }
  .swatch {
    width: 2.4rem;
    height: 2.4rem;
    min-height: 2.4rem;
    padding: 0;
    border-radius: var(--cell-radius);
    box-shadow: none;
  }
  .swatch.graphite {
    background:
      var(--pencil-grain),
      var(--graphite);
    background-size: 64px 64px, auto;
  }
  .swatch.red {
    background:
      var(--pencil-grain),
      var(--red-pencil);
    background-size: 64px 64px, auto;
  }
  .swatch.sel {
    outline: 2.5px solid var(--ink);
    outline-offset: 2px;
  }
</style>
