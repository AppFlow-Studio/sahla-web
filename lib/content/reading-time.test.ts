import { describe, it, expect } from "vitest";
import { estimateReadingTime } from "./reading-time";

describe("estimateReadingTime", () => {
  it("returns 1 minute for very short text", () => {
    expect(estimateReadingTime("just a few words here")).toBe(1);
  });

  it("returns 2 minutes for roughly 400 words", () => {
    const body = Array(400).fill("word").join(" ");
    expect(estimateReadingTime(body)).toBe(2);
  });

  it("collapses multiple whitespace characters into single word boundaries", () => {
    const body = "one\n\ntwo   three\tfour";
    expect(estimateReadingTime(body, 2)).toBe(2);
  });

  it("never returns less than 1 minute for empty or whitespace-only input", () => {
    expect(estimateReadingTime("   ")).toBe(1);
  });
});
