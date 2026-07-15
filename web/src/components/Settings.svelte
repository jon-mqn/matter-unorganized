<script lang="ts">
  import { STAR_SIZES, type Difficulty } from "../lib/engine.js";
  import { REALLY_MAX_SIZE } from "../lib/url.js";
  import type { Game } from "../lib/game.svelte.js";

  const { game }: { game: Game } = $props();

  const difficulties: Difficulty[] = ["normal", "hard", "really"];
  const DIFFICULTY_LABEL: Record<Difficulty, string> = {
    normal: "Normal",
    hard: "Hard",
    really: "Really?",
  };

  let dialog = $state<HTMLDialogElement>();

  function open() {
    dialog?.showModal();
  }
  function setSize(size: number) {
    if (size !== game.starSize) game.setStarSize(size);
  }
  function setDifficulty(d: Difficulty) {
    if (d !== game.difficulty) game.newPuzzle(d);
  }
</script>

<button class="trigger" onclick={open}>⚙ Settings</button>

<dialog
  bind:this={dialog}
  class="modal"
  onclick={(e) => e.target === dialog && dialog?.close()}
>
  <div class="head">
    <h2>Settings</h2>
    <button class="close" aria-label="Close" onclick={() => dialog?.close()}>×</button>
  </div>

  <label class="row">
    <span>Board size</span>
    <select
      value={game.starSize}
      onchange={(e) => setSize(Number(e.currentTarget.value))}
    >
      {#each STAR_SIZES as opt}
        <option value={opt}>{opt}×{opt}</option>
      {/each}
    </select>
  </label>

  <label class="row">
    <span>Difficulty</span>
    <select
      value={game.difficulty}
      onchange={(e) => setDifficulty(e.currentTarget.value as Difficulty)}
    >
      {#each difficulties as d}
        <option value={d} disabled={d === "really" && (game.starSize ?? 0) > REALLY_MAX_SIZE}>
          {DIFFICULTY_LABEL[d]}
        </option>
      {/each}
    </select>
  </label>
  {#if (game.starSize ?? 0) > REALLY_MAX_SIZE}
    <p class="note">"Really?" takes too long to generate on this board size.</p>
  {/if}

  <div class="row" title="Doodle stamped on the first tap of a cell">
    <span>First tap</span>
    <span class="swatches">
      <button
        class="swatch"
        class:sel={game.firstColor === 1}
        aria-label="{game.doodles.black.name} first"
        onclick={() => game.setFirstColor(1)}
      >
        <img src={game.doodles.black.url} alt="" />
      </button>
      <button
        class="swatch"
        class:sel={game.firstColor === 0}
        aria-label="{game.doodles.red.name} first"
        onclick={() => game.setFirstColor(0)}
      >
        <img src={game.doodles.red.url} alt="" />
      </button>
    </span>
  </div>

  <label class="row">
    <span>Show star counts</span>
    <input
      type="checkbox"
      checked={game.showStarCounts}
      onchange={(e) => game.setShowStarCounts(e.currentTarget.checked)}
    />
  </label>

  <label class="row">
    <span>Instant validation</span>
    <input
      type="checkbox"
      checked={game.instantValidation}
      onchange={(e) => game.setInstantValidation(e.currentTarget.checked)}
    />
  </label>

  <p class="hint">
    Changing the board size or difficulty starts a fresh puzzle.
  </p>
</dialog>

<style>
  .trigger {
    font-family: var(--font-hand);
  }

  .modal {
    max-width: 430px;
    width: calc(100vw - 2rem);
    border: 2px solid var(--ink);
    border-radius: var(--sketch-radius);
    background: var(--paper);
    box-shadow: 3px 4px 0 rgba(44, 49, 58, 0.28);
    padding: 1rem 1.1rem 1.1rem;
    color: var(--ink);
  }
  .modal::backdrop {
    background: rgba(44, 49, 58, 0.38);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  h2 {
    margin: 0;
    font-family: var(--font-hand);
    font-weight: 400;
    font-size: 1.4rem;
  }
  .close {
    min-height: 0;
    padding: 0.1rem 0.55rem;
    line-height: 1;
    font-size: 1.3rem;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.45rem 0;
    font-family: var(--font-hand);
    font-size: 1.05rem;
    color: var(--ink);
    cursor: pointer;
  }
  .row + .row {
    border-top: 1.3px dashed var(--grid-major);
  }

  input[type="checkbox"] {
    width: 1.35rem;
    height: 1.35rem;
    accent-color: var(--ink);
    cursor: pointer;
  }

  .swatches {
    display: inline-flex;
    gap: 0.4rem;
  }
  .swatch {
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    min-height: 2.4rem;
    padding: 0;
    border-radius: var(--cell-radius);
    box-shadow: none;
    background: var(--paper);
  }
  .swatch img {
    width: 82%;
    height: 82%;
  }
  .swatch.sel {
    outline: 2.5px solid var(--ink);
    outline-offset: 2px;
  }

  .note {
    margin: 0.1rem 0 0;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }
  .hint {
    margin: 0.8rem 0 0;
    color: var(--ink-soft);
    font-size: 0.85rem;
    line-height: 1.4;
  }
</style>
