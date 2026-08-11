import { describe, it, expect } from "vitest";
import { getElapsedSeconds, formatElapsed, currentMinute } from "@/lib/elapsed-time";

describe("getElapsedSeconds", () => {
  it("returns the stored base when the match isn't live", () => {
    expect(
      getElapsedSeconds({ elapsedTime: 120, startTime: null, timerPausedAt: null, status: "scheduled" })
    ).toBe(120);
  });

  it("returns the stored base when paused, even if start_time is set", () => {
    const startTime = new Date(Date.now() - 60_000);
    expect(
      getElapsedSeconds({ elapsedTime: 300, startTime, timerPausedAt: new Date(), status: "live" })
    ).toBe(300);
  });

  it("adds time elapsed since start_time when running", () => {
    const startTime = new Date(Date.now() - 90_000); // 90s ago
    const result = getElapsedSeconds({ elapsedTime: 0, startTime, timerPausedAt: null, status: "live" });
    // allow a couple seconds of test-execution slack
    expect(result).toBeGreaterThanOrEqual(88);
    expect(result).toBeLessThanOrEqual(92);
  });

  it("never returns a negative value", () => {
    const startTime = new Date(Date.now() + 10_000); // clock skew: "in the future"
    expect(
      getElapsedSeconds({ elapsedTime: 0, startTime, timerPausedAt: null, status: "live" })
    ).toBeGreaterThanOrEqual(0);
  });

  it("ignores a running start_time if status isn't live/halftime", () => {
    const startTime = new Date(Date.now() - 500_000);
    expect(
      getElapsedSeconds({ elapsedTime: 42, startTime, timerPausedAt: null, status: "finished" })
    ).toBe(42);
  });
});

describe("formatElapsed", () => {
  it("formats seconds as mm:ss, zero-padded", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(65)).toBe("01:05");
    expect(formatElapsed(3600)).toBe("60:00");
  });
});

describe("currentMinute", () => {
  it("floors seconds down to whole minutes", () => {
    expect(currentMinute(0)).toBe(0);
    expect(currentMinute(59)).toBe(0);
    expect(currentMinute(60)).toBe(1);
    expect(currentMinute(2820)).toBe(47);
  });
});
