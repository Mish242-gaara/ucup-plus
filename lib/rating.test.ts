import { describe, it, expect } from "vitest";
import { computeMatchRating } from "@/lib/rating";

describe("computeMatchRating", () => {
  it("returns the neutral base rating adjusted only by team result", () => {
    expect(
      computeMatchRating({ goals: 0, assists: 0, yellowCards: 0, redCards: 0, teamResult: "draw" })
    ).toBe(6.0);
    expect(
      computeMatchRating({ goals: 0, assists: 0, yellowCards: 0, redCards: 0, teamResult: "win" })
    ).toBe(6.3);
    expect(
      computeMatchRating({ goals: 0, assists: 0, yellowCards: 0, redCards: 0, teamResult: "loss" })
    ).toBe(5.7);
  });

  it("rewards goals and assists", () => {
    expect(
      computeMatchRating({ goals: 2, assists: 1, yellowCards: 0, redCards: 0, teamResult: "win" })
    ).toBeCloseTo(9.0, 5);
  });

  it("penalizes cards", () => {
    expect(
      computeMatchRating({ goals: 0, assists: 0, yellowCards: 1, redCards: 0, teamResult: "draw" })
    ).toBe(5.5);
    expect(
      computeMatchRating({ goals: 0, assists: 0, yellowCards: 0, redCards: 1, teamResult: "loss" })
    ).toBe(4.2);
  });

  it("clamps to the [1, 10] range", () => {
    expect(
      computeMatchRating({ goals: 10, assists: 10, yellowCards: 0, redCards: 0, teamResult: "win" })
    ).toBe(10);
    expect(
      computeMatchRating({ goals: 0, assists: 0, yellowCards: 5, redCards: 3, teamResult: "loss" })
    ).toBe(1);
  });
});
