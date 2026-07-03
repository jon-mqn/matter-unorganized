import { parseBoardToken, type Difficulty } from "./engine.js";

export interface PuzzleParams {
  /** Board token: "-"-joined even sizes, e.g. "6-6-8" (also accepts "reference"). */
  board: string;
  difficulty: Difficulty;
  seed: number;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/** "#6-6-8/hard/12345" */
export function encodeParams(p: PuzzleParams): string {
  return `#${p.board}/${p.difficulty}/${p.seed}`;
}

/** Parse a location hash into params, or null if malformed. */
export function decodeHash(hash: string): PuzzleParams | null {
  const parts = hash.replace(/^#/, "").split("/");
  if (parts.length !== 3) return null;
  const [board, difficulty, seedStr] = parts as [string, string, string];
  if (!parseBoardToken(board)) return null;
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) return null;
  const seed = Number(seedStr);
  if (!Number.isInteger(seed) || seed < 0) return null;
  return { board, difficulty: difficulty as Difficulty, seed };
}

/** A fresh 32-bit seed. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}
