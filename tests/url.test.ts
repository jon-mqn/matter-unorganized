import { describe, expect, it } from "vitest";
import { decodeHash, encodeParams } from "../web/src/lib/url.js";

describe("url params (seed sharing)", () => {
  it("round-trips through encode/decode", () => {
    const params = { board: "s9", difficulty: "hard" as const, seed: 12345 };
    expect(decodeHash(encodeParams(params))).toEqual(params);
  });

  it("maps legacy difficulty names to normal", () => {
    expect(decodeHash("#s7/medium/123")).toEqual({
      board: "s7",
      difficulty: "normal",
      seed: 123,
    });
    expect(decodeHash("#s7/easy/123")?.difficulty).toBe("normal");
  });

  it("rejects malformed hashes", () => {
    expect(decodeHash("#s7/hard")).toBeNull();
    expect(decodeHash("#s7/impossible/1")).toBeNull();
    expect(decodeHash("#s7/hard/notanumber")).toBeNull();
    expect(decodeHash("#s8/hard/1")).toBeNull(); // even size
    expect(decodeHash("#6-6-8/hard/1")).toBeNull(); // classic token
    expect(decodeHash("")).toBeNull();
  });
});
