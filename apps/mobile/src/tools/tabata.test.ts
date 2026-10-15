import { describe, expect, it } from "vitest";
import {
  createTabataPlan,
  decodeTabataSettings,
  defaultTabata,
  encodeTabataSettings,
  formatTabataDuration,
  parseTabataInteger,
  tabataSettingsError,
  tabataTotalSeconds,
} from "./tabata";

describe("타바타 운동 계획", () => {
  it("기본 8세트는 준비를 포함해 4분이며 마지막 휴식을 생략한다", () => {
    const plan = createTabataPlan(defaultTabata);
    expect(tabataTotalSeconds(defaultTabata)).toBe(240);
    expect(plan.reduce((sum, step) => sum + step.seconds, 0)).toBe(240);
    expect(plan).toHaveLength(16);
    expect(plan[0]?.kind).toBe("prepare");
    expect(plan.at(-1)).toEqual({
      label: "운동",
      seconds: 20,
      round: 8,
      totalRounds: 8,
      kind: "work",
    });
    expect(plan.filter((step) => step.kind === "rest")).toHaveLength(7);
  });

  it("준비 뒤 운동과 휴식을 세트 순서대로 실행한다", () => {
    const plan = createTabataPlan({
      ...defaultTabata,
      prepareSeconds: 5,
      workSeconds: 30,
      restSeconds: 15,
      rounds: 2,
    });
    expect(
      plan.map(({ kind, seconds, round }) => [kind, seconds, round]),
    ).toEqual([
      ["prepare", 5, 1],
      ["work", 30, 1],
      ["rest", 15, 1],
      ["work", 30, 2],
    ]);
    expect(
      tabataTotalSeconds({
        ...defaultTabata,
        prepareSeconds: 5,
        workSeconds: 30,
        restSeconds: 15,
        rounds: 2,
      }),
    ).toBe(80);
  });

  it("준비와 휴식이 0초이면 양수 길이의 운동만 만든다", () => {
    const plan = createTabataPlan({
      ...defaultTabata,
      prepareSeconds: 0,
      restSeconds: 0,
      rounds: 3,
    });
    expect(plan.map(({ kind, round }) => [kind, round])).toEqual([
      ["work", 1],
      ["work", 2],
      ["work", 3],
    ]);
    expect(plan.every((step) => step.seconds > 0)).toBe(true);
  });

  it("1세트에서는 휴식 설정에 관계없이 준비와 운동만 실행한다", () => {
    const settings = { ...defaultTabata, rounds: 1, restSeconds: 3600 };
    expect(createTabataPlan(settings).map((step) => step.kind)).toEqual([
      "prepare",
      "work",
    ]);
    expect(tabataTotalSeconds(settings)).toBe(30);
  });

  it("경계값을 허용하고 소수, 비정수, 범위 밖 입력을 거부한다", () => {
    expect(
      tabataSettingsError({
        ...defaultTabata,
        prepareSeconds: 0,
        workSeconds: 1,
        restSeconds: 0,
        rounds: 99,
      }),
    ).toBeNull();
    expect(
      tabataSettingsError({
        ...defaultTabata,
        prepareSeconds: 60,
        workSeconds: 3600,
        restSeconds: 3600,
        rounds: 1,
      }),
    ).toBeNull();
    for (const patch of [
      { prepareSeconds: -1 },
      { prepareSeconds: 61 },
      { workSeconds: 0 },
      { workSeconds: 3601 },
      { restSeconds: -1 },
      { restSeconds: 3601 },
      { rounds: 0 },
      { rounds: 100 },
      { rounds: 1.5 },
      { workSeconds: NaN },
      { workSeconds: Infinity },
      { workSeconds: "20" },
      { sound: "true" },
    ]) {
      expect(
        tabataSettingsError({ ...defaultTabata, ...patch }),
      ).not.toBeNull();
      expect(() =>
        createTabataPlan({
          ...defaultTabata,
          ...patch,
        } as typeof defaultTabata),
      ).toThrow();
    }
  });

  it("총시간은 12시간까지 허용하고 초과 계획을 거부한다", () => {
    expect(
      tabataSettingsError({
        ...defaultTabata,
        prepareSeconds: 0,
        workSeconds: 3600,
        restSeconds: 0,
        rounds: 12,
      }),
    ).toBeNull();
    expect(
      tabataSettingsError({
        ...defaultTabata,
        prepareSeconds: 1,
        workSeconds: 3600,
        restSeconds: 0,
        rounds: 12,
      }),
    ).toContain("12시간");
  });

  it("빈 입력을 0으로 간주하지 않고 정수 텍스트만 읽는다", () => {
    expect(parseTabataInteger("0")).toBe(0);
    expect(parseTabataInteger(" 20 ")).toBe(20);
    for (const value of ["", " ", "1.5", "1e2", "-1", "20초"]) {
      expect(Number.isNaN(parseTabataInteger(value))).toBe(true);
    }
  });

  it("전체 시간은 시·분·초로 읽을 수 있게 표시한다", () => {
    expect(formatTabataDuration(240)).toBe("4분");
    expect(formatTabataDuration(3665)).toBe("1시간 1분 5초");
    expect(formatTabataDuration(0)).toBe("0초");
  });
});

describe("타바타 설정 보관", () => {
  it("최초 실행은 독립된 기본값을 반환하고 유효한 설정을 왕복한다", () => {
    const fresh = decodeTabataSettings(null);
    expect(fresh).toEqual(defaultTabata);
    expect(fresh).not.toBe(defaultTabata);
    const settings = { ...defaultTabata, rounds: 6, sound: false };
    expect(decodeTabataSettings(encodeTabataSettings(settings))).toEqual(
      settings,
    );
  });

  it("손상된 저장값과 지원하지 않는 버전을 기본값으로 덮어쓰지 않는다", () => {
    for (const raw of [
      "",
      "{",
      "null",
      "[]",
      "{}",
      JSON.stringify({ version: 2, settings: defaultTabata }),
      JSON.stringify({ version: 1, settings: {} }),
      JSON.stringify({ version: 1, settings: { ...defaultTabata, rounds: 0 } }),
    ]) {
      expect(() => decodeTabataSettings(raw)).toThrow();
    }
    expect(() =>
      encodeTabataSettings({ ...defaultTabata, restSeconds: -1 }),
    ).toThrow();
  });
});
