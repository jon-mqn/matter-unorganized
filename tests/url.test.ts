import { describe, expect, it } from "vitest";
import { decodeHash, encodeParams } from "../web/src/lib/url.js";

describe("url params (seed sharing)", () => {
  it("round-trips through encode/decode", () => {
    const params = { board: "6-6-8", difficulty: "hard" as const, seed: 12345 };
    expect(decodeHash(encodeParams(params))).toEqual(params);
  });

  it("rejects malformed hashes", () => {
    expect(decodeHash("#6-6/hard")).toBeNull();
    expect(decodeHash("#6-6/impossible/1")).toBeNull();
    expect(decodeHash("#6-6/hard/notanumber")).toBeNull();
    expect(decodeHash("#6-7/hard/1")).toBeNull(); // odd size
    expect(decodeHash("")).toBeNull();
  });
});
