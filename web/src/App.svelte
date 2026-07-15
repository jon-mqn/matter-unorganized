<script lang="ts">
  import Board from "./components/Board.svelte";
  import Settings from "./components/Settings.svelte";
  import Controls from "./components/Controls.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import { Game } from "./lib/game.svelte.js";
  import { decodeHash, randomSeed } from "./lib/url.js";

  const game = new Game();

  // Load the puzzle described by the URL hash, or a fresh random one.
  const params =
    decodeHash(location.hash) ?? {
      board: "s7",
      difficulty: "normal" as const,
      seed: randomSeed(),
    };
  game.generate(params);
</script>

<main>
  <header>
    <h1>Matter unorganized</h1>
    <p class="rules">
     Fill each square such that no three consecutive squares have the same doodle. Each row and column have the same number of doodles and have exactly one star. Inspired by Tohu wa Vohu by Adolfo Zanellati.
    </p>
  </header>

  <Controls {game} />
  <Settings {game} />
  <Board {game} />
  <StatusBar {game} />

  <footer class="credit">
    Doodles by
    <a href="https://github.com/MariaLetta/mega-doodles-pack" target="_blank" rel="noopener">Maria Letta</a>
    ·
    <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>
  </footer>
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

  /* Artwork attribution, jotted at the foot of the sheet. */
  .credit {
    margin-top: 0.5rem;
    font-family: var(--font-hand);
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  .credit a {
    color: inherit;
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
