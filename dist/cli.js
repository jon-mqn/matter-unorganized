import { parseArgs } from "node:util";
import { resolveBoard } from "./boards.js";
import { makeRng } from "./rng.js";
import { generate } from "./generate.js";
import { renderAscii } from "./render.js";
/**
 * Thin CLI (§5 emit): generate a puzzle at a difficulty and print the clue set,
 * the solution, the rating, and per-tier invocation counts. Deterministic for a
 * given --seed.
 *
 *   tsx src/cli.ts --board 6-6-8 --difficulty hard --seed 123 [--passes 30]
 *
 * --board is "reference", a "-"-joined list of even square sizes (each 6..14,
 * e.g. "6-6", "6-6-8", "8-8"), or a star-variant token "s7" | "s9" | "s11" |
 * "s15" (odd square; each line holds one special on top of the colour balance).
 */
function main() {
    const { values } = parseArgs({
        options: {
            board: { type: "string", default: "reference" },
            difficulty: { type: "string", default: "hard" },
            seed: { type: "string", default: "1" },
            passes: { type: "string", default: "30" },
        },
    });
    const difficulty = values.difficulty;
    if (!["easy", "medium", "hard"].includes(difficulty)) {
        console.error(`Unknown difficulty "${difficulty}". Use easy | medium | hard.`);
        process.exit(1);
    }
    let board;
    try {
        board = resolveBoard(values.board);
    }
    catch (err) {
        console.error(err.message);
        console.error('Use "reference", even sizes like "6-6-8" (each 6..14), or a star board "s7" | "s9" | "s11" | "s15".');
        process.exit(1);
    }
    const seed = Number(values.seed);
    const passes = Number(values.passes);
    const puzzle = generate(board, difficulty, makeRng(seed), { passes });
    console.log(`Board:      ${puzzle.boardId}`);
    console.log(`Difficulty: ${difficulty} (rated: ${puzzle.rating})`);
    console.log(`Seed:       ${seed}`);
    console.log(`Clues:      ${puzzle.clues.size}`);
    console.log(`Tiers:      t1=${puzzle.counts.tier1} t2=${puzzle.counts.tier2} t3=${puzzle.counts.tier3}`);
    console.log("\nPuzzle:");
    console.log(renderAscii(board, puzzle.clues));
    console.log("\nSolution:");
    console.log(renderAscii(board, puzzle.solution));
}
main();
//# sourceMappingURL=cli.js.map