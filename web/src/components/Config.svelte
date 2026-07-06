<script lang="ts">
  import {
    MAX_BLOCKS,
    MAX_SIZE,
    MIN_SIZE,
    STAR_SIZES,
    validateSizes,
  } from "../lib/engine.js";
  import type { Game } from "../lib/game.svelte.js";

  const { game }: { game: Game } = $props();

  const SIZE_OPTIONS: number[] = [];
  for (let s = MIN_SIZE; s <= MAX_SIZE; s += 2) SIZE_OPTIONS.push(s);

  let dialog = $state<HTMLDialogElement>();
  let draft = $state<number[]>([]);
  let variant = $state<"classic" | "star">("classic");
  let draftStar = $state<number>(7);

  const cells = $derived(
    variant === "star" ? draftStar * draftStar : draft.reduce((n, s) => n + s * s, 0),
  );
  const error = $derived.by(() => {
    if (variant === "star") return null;
    try {
      validateSizes(draft);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  });
  const dirty = $derived(
    variant === "star"
      ? !(game.isStar && draftStar === game.starSize)
      : game.isStar || draft.join("-") !== game.sizes.join("-"),
  );

  function open() {
    variant = game.isStar ? "star" : "classic";
    draftStar = game.starSize ?? 7;
    draft = [...game.sizes];
    dialog?.showModal();
  }
  function setSize(i: number, v: number) {
    draft = draft.map((s, j) => (j === i ? v : s));
  }
  function add() {
    if (draft.length < MAX_BLOCKS) draft = [...draft, 6];
  }
  function remove(i: number) {
    if (draft.length > 1) draft = draft.filter((_, j) => j !== i);
  }
  function apply() {
    if (variant === "star") {
      game.setStarSize(draftStar);
    } else {
      if (error) return;
      game.setSizes([...draft]);
    }
    dialog?.close();
  }
  function shuffle() {
    game.shuffleShape();
    dialog?.close();
  }
</script>

<button class="trigger" onclick={open}>
  ▦ Board: {game.isStar ? `✶ ${game.starSize}×${game.starSize}` : game.sizes.join(" · ")}
</button>

<dialog
  bind:this={dialog}
  class="modal"
  onclick={(e) => e.target === dialog && dialog?.close()}
>
  <div class="head">
    <h2>Customize board</h2>
    <button class="close" aria-label="Close" onclick={() => dialog?.close()}>×</button>
  </div>

  <div class="variants" role="radiogroup" aria-label="Puzzle variant">
    <button
      class="variant"
      class:sel={variant === "classic"}
      onclick={() => (variant = "classic")}
    >
      Classic
    </button>
    <button
      class="variant"
      class:sel={variant === "star"}
      onclick={() => (variant = "star")}
    >
      ✶ Star
    </button>
  </div>

  {#if variant === "classic"}
    <p class="hint">
      Combine 1–{MAX_BLOCKS} squares (sizes {MIN_SIZE}–{MAX_SIZE}, even). They're
      arranged in a random mix of stacked, side-by-side and overlapping layouts
      sharing a spine — use Shuffle shape to re-roll.
    </p>

    <div class="squares">
      {#each draft as size, i (i)}
        <div class="square">
          <select value={size} onchange={(e) => setSize(i, Number(e.currentTarget.value))}>
            {#each SIZE_OPTIONS as opt}
              <option value={opt}>{opt}×{opt}</option>
            {/each}
          </select>
          {#if draft.length > 1}
            <button class="icon" title="Remove" onclick={() => remove(i)}>×</button>
          {/if}
        </div>
      {/each}
      {#if draft.length < MAX_BLOCKS}
        <button class="add" onclick={add}>+ square</button>
      {/if}
    </div>
  {:else}
    <p class="hint">
      One odd square. Every row and column takes an equal share of graphite and
      red plus exactly one ✶ star — tap a cell a fourth time to pencil the
      star in.
    </p>

    <div class="squares">
      <select
        value={draftStar}
        onchange={(e) => (draftStar = Number(e.currentTarget.value))}
      >
        {#each STAR_SIZES as opt}
          <option value={opt}>{opt}×{opt}</option>
        {/each}
      </select>
    </div>
  {/if}

  <p class="meta">{cells} cells</p>
  {#if error}
    <p class="err">{error}</p>
  {/if}

  <div class="actions">
    {#if variant === "classic" && game.sizes.length > 1 && !game.isStar}
      <button
        title="Re-roll the arrangement (same squares)"
        disabled={dirty}
        onclick={shuffle}
      >
        ⤮ Shuffle shape
      </button>
    {/if}
    <button class="apply" disabled={!!error || !dirty} onclick={apply}>
      Apply &amp; generate
    </button>
  </div>
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
  .variants {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.7rem;
  }
  .variant {
    font-family: var(--font-hand);
  }
  .variant.sel {
    outline: 2.5px solid var(--ink);
    outline-offset: 1px;
  }
  .hint {
    margin: 0 0 0.8rem;
    color: var(--ink-soft);
    font-size: 0.85rem;
    line-height: 1.4;
  }
  .squares {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }
  .square {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }
  .icon {
    padding: 0.3rem 0.55rem;
    line-height: 1;
  }
  .meta {
    margin: 0.7rem 0 0;
    font-family: var(--font-mono);
    color: var(--ink-soft);
    font-size: 0.85rem;
  }
  .err {
    margin: 0.3rem 0 0;
    color: var(--correction);
    font-size: 0.85rem;
  }
  .actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.9rem;
  }
</style>
