import { describe, expect, it } from "vitest";
import {
  createRound,
  decodeState,
  freshState,
  injectInitialState,
  randomIndex,
  recordDraw,
} from "./state";
describe("board breaking draw", () => {
  it("places exactly the configured number of wins, including all-win and all-miss", () => {
    for (let count = 0; count <= 3; count++)
      for (const picks of [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [2, 0],
        [2, 1],
      ]) {
        let i = 0;
        const round = createRound(count, () => picks[i++]!);
        expect(round).toHaveLength(3);
        expect(round.filter(Boolean)).toHaveLength(count);
      }
    expect(() => createRound(4)).toThrow();
    expect(() => createRound(0.5)).toThrow();
  });
  it("covers all three positions equally across the six possible shuffles", () => {
    const hits = [0, 0, 0];
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 2; b++) {
        const picks = [a, b];
        const round = createRound(1, () => picks.shift()!);
        round.forEach((v, i) => {
          if (v) hits[i]!++;
        });
      }
    expect(hits).toEqual([2, 2, 2]);
    const values = [4294967295, 5];
    expect(randomIndex(3, () => values.shift()!)).toBe(2);
  });
  it("persists prize snapshots and bounds history independently of pinball", () => {
    let state = freshState();
    state.settings.prize = "칭찬 스티커";
    state = recordDraw(state, 2, true, "1", "2026-10-15T12:00:00Z");
    state.settings.prize = "새 선물";
    expect(state.history[0]?.prize).toBe("칭찬 스티커");
    for (let i = 0; i < 55; i++)
      state = recordDraw(
        state,
        i % 3,
        i % 2 === 0,
        String(i),
        "2026-10-15T12:00:00Z",
      );
    expect(state.history).toHaveLength(50);
    expect(decodeState(JSON.stringify(state))).toEqual(state);
  });
  it("rejects invalid saves and safely embeds user text", () => {
    expect(decodeState(null)).toEqual(freshState());
    for (const raw of [
      "null",
      "{",
      JSON.stringify({ ...freshState(), version: 3 }),
      JSON.stringify({
        ...freshState(),
        settings: { prize: "", sound: true, winningBoards: 1 },
      }),
    ])
      expect(() => decodeState(raw)).toThrow();
    const state = freshState();
    state.settings.prize = "$&</script>";
    const html = injectInitialState('"__INITIAL_BREAKING_STATE__"', state);
    expect(html).not.toContain("</script>");
    expect(JSON.parse(html)).toEqual(state);
  });
});
