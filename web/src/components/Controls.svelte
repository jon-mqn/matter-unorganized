<script lang="ts">
  import type { Game } from "../lib/game.svelte.js";

  const { game }: { game: Game } = $props();

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
</div>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
  }
  button.active {
    background: var(--hint);
    color: var(--ink);
  }
</style>
