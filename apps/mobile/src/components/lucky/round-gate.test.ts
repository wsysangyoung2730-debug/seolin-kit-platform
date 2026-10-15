import { describe, expect, it, vi } from "vitest";
import { RoundGate } from "./round-gate";

describe("lucky presentation round", () => {
  it("commits once while pending and rejects extra draws until a revealed result is reset", async () => {
    let resolve!: (value: string) => void;
    const draw = vi.fn(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );
    const gate = new RoundGate<string>();
    const pending = gate.request(draw);
    expect(await gate.request(draw)).toEqual({ status: "ignored" });
    expect(gate.restart()).toBe(false);
    resolve("선물");
    expect(await pending).toEqual({ status: "result", value: "선물" });
    expect(await gate.request(draw)).toEqual({ status: "ignored" });
    expect(draw).toHaveBeenCalledTimes(1);
    expect(gate.restart()).toBe(false);
    expect(gate.reveal()).toBe("선물");
    expect(gate.reveal()).toBeNull();
    expect(gate.restart()).toBe(true);
    expect(await gate.request(async () => "다음 선물")).toEqual({
      status: "result",
      value: "다음 선물",
    });
  });

  it("allows retry after a rejected or empty transaction without inventing a prize", async () => {
    const gate = new RoundGate<string>();
    expect(await gate.request(async () => null)).toEqual({ status: "empty" });
    expect(gate.reveal()).toBeNull();
    expect(
      await gate.request(async () => {
        throw new Error("storage unavailable");
      }),
    ).toEqual({ status: "failed" });
    expect(gate.value).toBeNull();
    expect(await gate.request(async () => "확정된 결과")).toEqual({
      status: "result",
      value: "확정된 결과",
    });
  });

  it("drops pending presentation after unmount while allowing the persistence transaction to finish", async () => {
    let resolve!: (value: string) => void;
    const gate = new RoundGate<string>();
    const pending = gate.request(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    gate.dispose();
    resolve("이미 저장된 선물");
    expect(await pending).toEqual({ status: "ignored" });
    expect(gate.value).toBeNull();
    expect(gate.reveal()).toBeNull();
    expect(await gate.request(async () => "또 다른 결과")).toEqual({
      status: "ignored",
    });
  });
});
