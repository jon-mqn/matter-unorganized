<script lang="ts">
  import Board from "./components/Board.svelte";
  import Config from "./components/Config.svelte";
  import Controls from "./components/Controls.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import { Game } from "./lib/game.svelte.js";
  import { decodeHash, randomSeed } from "./lib/url.js";

  const game = new Game();

  // Load the puzzle described by the URL hash, or a fresh random one.
  const params =
    decodeHash(location.hash) ?? {
      board: "6-6",
      difficulty: "medium" as const,
      seed: randomSeed(),
    };
  game.generate(params);
</script>

<main>
  <header>
    <h1>Matter unorganized</h1>
    <p class="rules">No three in a row · each line half graphite, half red</p>
  </header>

  <Controls {game} />
  <Config {game} />
  <Board {game} />
  <StatusBar {game} />
</main>

<style>
  main {
    position: relative;
    max-width: 640px;
    margin: 0 auto;
    padding: 1.25rem 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    align-items: center;
  }
  header {
    text-align: center;
    margin-bottom: 0.25rem;
  }
  h1 {
    margin: 0;
    font-family: var(--font-hand);
    font-size: clamp(2rem, 8vw, 3rem);
    font-weight: 400;
    letter-spacing: 0.5px;
    line-height: 1;
    color: var(--ink);
    transform: rotate(-1.2deg);
  }
  .rules {
    margin: 0.4rem 0 0;
    font-family: var(--font-hand);
    color: var(--ink-soft);
    font-size: 1.05rem;
  }

  /* Notebook margin rule, drawn down the left of the sheet on wider screens. */
  @media (min-width: 680px) {
    main {
      padding-left: 2.5rem;
    }
    main::before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 1.4rem;
      width: 2px;
      background: var(--margin-red);
    }
  }
</style>
