import { describe, expect, it } from "vitest";
import {
  decodeState,
  freshState,
  injectInitialState,
  laneAt,
  recordDraw,
  winningLanes,
  selectedWinningLanes,
  toggleWinningLane,
} from "./state";
import { createPhysics } from "./physics.js";

describe("pinball settings and records", () => {
  it("embeds saved prize text without HTML or replacement-string injection", () => {
    const state = freshState();
    state.settings.prize = "$&</script><script>";
    const html = injectInitialState(
      'let state="__INITIAL_PINBALL_STATE__";',
      state,
    );
    expect(html).toContain("$&\\u003c/script>");
    expect(html).not.toContain("</script>");
    expect(html).not.toContain("__INITIAL_PINBALL_STATE__");
    expect(JSON.parse(html.slice(10, -1))).toEqual(state);
  });
  it("supports all-win and all-miss layouts without inventing a probability", () => {
    for (let n = 0; n <= 5; n++) expect(winningLanes(n)).toHaveLength(n);
    expect(() => winningLanes(2.5)).toThrow();
    expect(() => winningLanes(6)).toThrow();
    const all = freshState();
    all.settings.winningBins = 5;
    const none = freshState();
    none.settings.winningBins = 0;
    for (let i = 0; i < 5; i++) {
      expect(
        recordDraw(all, i, "id", "2026-10-15T00:00:00Z").history[0]?.won,
      ).toBe(true);
      expect(
        recordDraw(none, i, "id", "2026-10-15T00:00:00Z").history[0]?.won,
      ).toBe(false);
    }
  });
  it("persists independent lane changes and uses them for results", () => {
    const state = freshState();
    state.settings = toggleWinningLane(state.settings, 1);
    state.settings = toggleWinningLane(state.settings, 4);
    expect(selectedWinningLanes(state.settings)).toEqual([3, 4]);
    const restored = decodeState(JSON.stringify(state));
    expect(
      recordDraw(restored, 4, "win", "2026-10-15T00:00:00Z").history[0]?.won,
    ).toBe(true);
    expect(
      recordDraw(restored, 1, "miss", "2026-10-15T00:00:00Z").history[0]?.won,
    ).toBe(false);
    expect(
      selectedWinningLanes(decodeState(JSON.stringify(freshState())).settings),
    ).toEqual([1, 3]);
    expect(() =>
      decodeState(
        JSON.stringify({
          ...state,
          settings: { ...state.settings, winningLaneIds: [3, 3] },
        }),
      ),
    ).toThrow();
  });
  it("retains the prize at draw time and only the latest 50 records", () => {
    let state = freshState();
    state.settings.prize = "칭찬 스티커";
    state = recordDraw(state, 1, "first", "2026-10-15T00:00:00Z");
    state.settings.prize = "새로운 선물";
    expect(state.history[0]?.prize).toBe("칭찬 스티커");
    for (let n = 0; n < 55; n++)
      state = recordDraw(state, 2, String(n), "2026-10-15T00:00:00Z");
    expect(state.history).toHaveLength(50);
    expect(decodeState(JSON.stringify(state))).toEqual(state);
  });
  it("rejects corrupt records and unsupported saved versions", () => {
    expect(decodeState(null)).toEqual(freshState());
    for (const value of [
      "{",
      "null",
      '"bad"',
      JSON.stringify({ ...freshState(), version: 2 }),
      JSON.stringify({ ...freshState(), history: [{ lane: 99 }] }),
    ])
      expect(() => decodeState(value)).toThrow();
    expect(laneAt(-3.2)).toBe(0);
    expect(laneAt(3.2)).toBe(4);
    expect(() => laneAt(NaN)).toThrow();
  });
});

describe("physical draws", () => {
  it("finishes varied launch paths in a real lane without escaping or stalling", () => {
    for (const x of [-2.4, -1.2, 0, 1.2, 2.4])
      for (const impulse of [-1.2, -0.3, 0.4, 1.2]) {
        const game = createPhysics();
        expect(game.launch(x, impulse)).toBe(true);
        expect(game.launch(x, impulse)).toBe(false);
        let result: { lane?: number; error?: string } | null = null;
        for (let n = 0; n < 4000 && result === null; n++)
          result = game.step(1 / 120);
        expect(result, `launch ${x}/${impulse}`).not.toBeNull();
        expect(result?.error, `launch ${x}/${impulse}`).toBeUndefined();
        expect(result?.lane).toBeGreaterThanOrEqual(0);
        expect(result?.lane).toBeLessThanOrEqual(4);
        expect(game.active).toBe(false);
        expect(game.launch(x, impulse)).toBe(true);
        game.cancel();
        expect(game.active).toBe(false);
      }
  });
});
