import { parseStarSize, type Difficulty } from "./engine.js";

export interface PuzzleParams {
  /** Board token: a star size like "s7". */
  board: string;
  difficulty: Difficulty;
  seed: number;
}

const DIFFICULTIES: Difficulty[] = ["normal", "hard", "really"];

/**
 * "Really?" (tier-4) generation blows the web time budget above this board
 * size, so bigger boards are capped at Hard.
 */
export const REALLY_MAX_SIZE = 11;

/** Difficulty names from links shared before the normal/hard/really rework. */
const LEGACY_DIFFICULTY: Record<string, Difficulty> = {
  easy: "normal",
  medium: "normal",
};

/** "#6-6-8/hard/12345" */
export function encodeParams(p: PuzzleParams): string {
  return `#${p.board}/${p.difficulty}/${p.seed}`;
}

/** Parse a location hash into params, or null if malformed. */
export function decodeHash(hash: string): PuzzleParams | null {
  const parts = hash.replace(/^#/, "").split("/");
  if (parts.length !== 3) return null;
  const [board, rawDifficulty, seedStr] = parts as [string, string, string];
  const size = parseStarSize(board);
  if (size === null) return null;
  let difficulty = LEGACY_DIFFICULTY[rawDifficulty] ?? rawDifficulty;
  if (difficulty === "really" && size > REALLY_MAX_SIZE) difficulty = "hard";
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) return null;
  const seed = Number(seedStr);
  if (!Number.isInteger(seed) || seed < 0) return null;
  return { board, difficulty: difficulty as Difficulty, seed };
}

/** A fresh 32-bit seed. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}
