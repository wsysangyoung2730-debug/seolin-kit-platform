import { describe, expect, it } from "vitest";
import {
  createLuckyState,
  decodeLucky,
  drawLucky,
  modes,
  parsePrizeDrafts,
  prizeDrafts,
  remainingTotal,
} from "./lucky-draw";
import { LuckyStore } from "./lucky-storage";
const prizes = [
  { id: "first", name: "첫 상품", quantity: 1, kind: "prize" as const },
  { id: "second", name: "둘째 상품", quantity: 3, kind: "prize" as const },
  { id: "miss", name: "다음 기회", quantity: 1, kind: "miss" as const },
];
function memoryStorage(raw: string | null = null) {
  return {
    raw,
    fail: false,
    getItem: async function () {
      return this.raw;
    },
    setItem: async function (_key: string, value: string) {
      if (this.fail) throw new Error("full");
      this.raw = value;
    },
  };
}
describe("quantity-weighted lucky draw", () => {
  it("has nine unique modes and uses each remaining unit as one ticket", () => {
    expect(modes).toHaveLength(9);
    expect(new Set(modes.map((mode) => mode.id)).size).toBe(9);
    const state = createLuckyState(prizes);
    expect(
      [0, 0.2, 0.4, 0.6, 0.8].map(
        (random) =>
          drawLucky(state, "roulette", { random: () => random }).result.prizeId,
      ),
    ).toEqual(["first", "second", "second", "second", "miss"]);
  });
  it("never redraws exhausted prizes, records misses, and ends at exactly zero", () => {
    let state = createLuckyState(prizes);
    const results = [];
    for (let i = 0; i < 5; i++) {
      const next = drawLucky(state, "scrolls", {
        random: () => 0,
        id: `draw-${i}`,
      });
      state = next.state;
      results.push(next.result.prizeId);
    }
    expect(results).toEqual(["first", "second", "second", "second", "miss"]);
    expect(remainingTotal(state)).toBe(0);
    expect(state.history.at(-1)?.kind).toBe("miss");
    expect(() => drawLucky(state, "capsule")).toThrow("모두");
    expect(decodeLucky(JSON.stringify(state))).toEqual(state);
  });
  it("selection position and display mode cannot bias the committed prize", () => {
    const state = createLuckyState(prizes);
    for (const mode of modes)
      for (const selectedIndex of [0, 1, 9])
        expect(
          drawLucky(state, mode.id, { selectedIndex, random: () => 0.6 }).result
            .prizeId,
        ).toBe("second");
  });
  it("rejects invalid inputs instead of silently truncating them", () => {
    for (const quantity of ["", "-1", "1.5", "1e2", "101", "0"])
      expect(() =>
        parsePrizeDrafts([{ ...prizeDrafts(prizes)[0]!, quantity }]),
      ).toThrow();
    expect(() => createLuckyState([...prizes, prizes[0]!])).toThrow();
    expect(() =>
      createLuckyState(
        Array.from({ length: 11 }, (_, i) => ({
          id: `p${i}`,
          name: "상품",
          quantity: 100,
          kind: "prize",
        })),
      ),
    ).toThrow("1,000");
    expect(() =>
      drawLucky(createLuckyState(prizes), "roulette", { random: () => 1 }),
    ).toThrow();
  });
  it("detects mismatched stock/history and duplicate records", () => {
    const next = drawLucky(createLuckyState(prizes), "mitts", {
      id: "one",
      random: () => 0,
    });
    expect(() =>
      decodeLucky(
        JSON.stringify({
          ...next.state,
          remaining: { ...next.state.remaining, first: 1 },
        }),
      ),
    ).toThrow();
    expect(() =>
      decodeLucky(
        JSON.stringify({ ...next.state, history: [next.result, next.result] }),
      ),
    ).toThrow();
    expect(() => decodeLucky("broken json")).toThrow();
  });
});
describe("atomic local stock and history persistence", () => {
  it("persists exactly one consumption before returning a result and survives a fresh store", async () => {
    const storage = memoryStorage(JSON.stringify(createLuckyState(prizes)));
    const result = await new LuckyStore(storage).draw("capsule");
    const reloaded = await new LuckyStore(storage).load();
    expect(reloaded.history).toEqual([result.result]);
    expect(remainingTotal(reloaded)).toBe(4);
  });
  it("leaves stock/history unchanged after write failure and allows retry", async () => {
    const initial = JSON.stringify(createLuckyState(prizes));
    const storage = memoryStorage(initial);
    const store = new LuckyStore(storage);
    storage.fail = true;
    await expect(store.draw("tiger")).rejects.toThrow("저장");
    expect(storage.raw).toBe(initial);
    storage.fail = false;
    expect((await store.draw("tiger")).state.history).toHaveLength(1);
  });
  it("rejects overlapping requests while a commit is pending", async () => {
    const storage = memoryStorage(JSON.stringify(createLuckyState(prizes)));
    let release!: () => void;
    let started!: () => void;
    const waiting = new Promise<void>((resolve) => {
      started = resolve;
    });
    const original = storage.setItem;
    storage.setItem = async function (key, raw) {
      started();
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return original.call(this, key, raw);
    };
    const store = new LuckyStore(storage);
    const first = store.draw("roulette");
    await waiting;
    await expect(store.draw("roulette")).rejects.toThrow("처리 중");
    release();
    await first;
    expect((await store.load()).history).toHaveLength(1);
  });
  it("does not overwrite corrupt saved state and recognizes a write acknowledged late", async () => {
    const storage = memoryStorage("corrupt");
    const store = new LuckyStore(storage);
    await expect(store.savePrizes(prizes)).rejects.toThrow("불러오지");
    expect(storage.raw).toBe("corrupt");
    storage.raw = JSON.stringify(createLuckyState(prizes));
    storage.setItem = async function (_key, raw) {
      this.raw = raw;
      throw new Error("late acknowledgement");
    };
    expect((await store.draw("lockers")).state.history).toHaveLength(1);
  });
});

describe("unknown storage outcome recovery", () => {
  it("blocks all mutations after a lost acknowledgement until a successful reload", async () => {
    const storage = memoryStorage(JSON.stringify(createLuckyState(prizes)));
    let readFails = false;
    let writes = 0;
    storage.getItem = async function () {
      if (readFails) throw new Error("offline");
      return this.raw;
    };
    storage.setItem = async function (_key, raw) {
      writes++;
      this.raw = raw;
      readFails = true;
      throw new Error("lost acknowledgement");
    };
    const store = new LuckyStore(storage);
    await expect(store.draw("medals")).rejects.toThrow("저장 결과를 확인");
    expect(store.recoveryRequired).toBe(true);
    await expect(store.draw("medals")).rejects.toThrow("마지막 결과");
    await expect(store.reset()).rejects.toThrow("마지막 결과");
    await expect(store.savePrizes(prizes)).rejects.toThrow("마지막 결과");
    await expect(store.load()).rejects.toThrow("마지막 결과");
    expect(writes).toBe(1);
    readFails = false;
    const restored = await store.load();
    expect(store.recoveryRequired).toBe(false);
    expect(restored.history).toHaveLength(1);
    expect(remainingTotal(restored)).toBe(4);
    storage.setItem = async function (_key, raw) {
      writes++;
      this.raw = raw;
    };
    expect((await store.draw("medals")).state.history).toHaveLength(2);
    expect(writes).toBe(2);
  });
});
