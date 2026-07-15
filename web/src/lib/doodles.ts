import { deriveSeed, makeRng, shuffle } from "./engine.js";

// Doodle artwork from Maria Letta's mega-doodles-pack
// (https://github.com/MariaLetta/mega-doodles-pack), CC BY-SA 4.0.
// See assets/ATTRIBUTION.md.
import monsterBlue from "../../../assets/doodle-11.svg";
import monsterOrange from "../../../assets/doodle-39.svg";
import monsterYellow from "../../../assets/doodle-42.svg";
import monsterGreen from "../../../assets/doodle-49.svg";
import starComet from "../../../assets/doodle-58.svg";
import starShooting from "../../../assets/doodle-137.svg";

export interface Doodle {
  url: string;
  /** Short human name, used in aria-labels and the settings swatches. */
  name: string;
}

/** The artwork for one game: a doodle per cell colour, plus its star. */
export interface DoodleSet {
  /** Doodle for cell value 1 (the old "graphite"). */
  black: Doodle;
  /** Doodle for cell value 0 (the old "red"). */
  red: Doodle;
  star: Doodle;
}

const MONSTERS: Doodle[] = [
  { url: monsterBlue, name: "blue monster" },
  { url: monsterOrange, name: "orange monster" },
  { url: monsterYellow, name: "yellow monster" },
  { url: monsterGreen, name: "green monster" },
];

const STARS: Doodle[] = [
  { url: starComet, name: "comet" },
  { url: starShooting, name: "shooting star" },
];

// Salt so the cosmetic stream is independent of the generator's use of the seed.
const DOODLE_SALT = 0x600d1e;

/**
 * Pick the game's artwork from the puzzle seed: two distinct monsters for the
 * two cell colours and one of the star doodles. Deterministic, so a shared
 * puzzle URL reproduces the same look.
 */
export function pickDoodles(seed: number): DoodleSet {
  const rng = makeRng(deriveSeed(seed, DOODLE_SALT));
  const [black, red] = shuffle([...MONSTERS], rng) as [Doodle, Doodle, ...Doodle[]];
  const star = STARS[Math.floor(rng() * STARS.length)]!;
  return { black, red, star };
}
