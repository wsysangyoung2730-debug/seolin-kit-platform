import { describe, expect, it } from "vitest";
import {
  advanceTimer,
  initialTimer,
  timerFrame,
  totalDuration,
} from "./timer-engine";
import {
  buildClassroomPlan,
  classroomFields,
  decodeClassroom,
  defaultClassroomSettings,
  parseClassroom,
  validateClassroom,
} from "./timer-classroom";

describe("monotonic classroom timer", () => {
  const plan = buildClassroomPlan({
    minutes: 0,
    seconds: 20,
    preparation: 5,
    rest: 10,
    rounds: 2,
    sound: true,
  });
  const total = totalDuration(plan);
  it("catches up across multiple phase boundaries after a delayed tick", () => {
    let state = advanceTimer(initialTimer(), "start", 1000, total);
    state = advanceTimer(state, "tick", 38000, total);
    expect(state.elapsedMs).toBe(37000);
    expect(timerFrame(plan, state.elapsedMs)).toMatchObject({
      index: 3,
      remainingMs: 18000,
      step: { kind: "work", round: 2 },
    });
  });
  it("does not count paused wall time and preserves subsecond remainder", () => {
    let state = advanceTimer(initialTimer(), "start", 0, total);
    state = advanceTimer(state, "pause", 2150, total);
    state = advanceTimer(state, "tick", 300000, total);
    expect(state.elapsedMs).toBe(2150);
    state = advanceTimer(state, "resume", 400000, total);
    state = advanceTimer(state, "tick", 400850, total);
    expect(state.elapsedMs).toBe(3000);
  });
  it("completes before a pause at the exact deadline and stays completed", () => {
    const running = advanceTimer(initialTimer(), "start", 100, total);
    const done = advanceTimer(running, "pause", total + 100, total);
    expect(done.status).toBe("completed");
    expect(advanceTimer(done, "tick", 999999, total)).toBe(done);
    expect(advanceTimer(done, "resume", 999999, total)).toBe(done);
    expect(advanceTimer(done, "reset", 999999, total)).toEqual(initialTimer());
  });
  it("omits zero preparation/rest, switches exactly at boundaries and has no final rest", () => {
    const value = {
      ...defaultClassroomSettings,
      minutes: 0,
      seconds: 1,
      preparation: 0,
      rest: 0,
      rounds: 3,
    };
    const steps = buildClassroomPlan(value);
    expect(steps).toHaveLength(3);
    expect(totalDuration(steps)).toBe(3000);
    expect(timerFrame(steps, 1000).step?.round).toBe(2);
    const done = advanceTimer(
      advanceTimer(initialTimer(), "start", 0, 3000),
      "tick",
      9999,
      3000,
    );
    expect(done).toMatchObject({ elapsedMs: 3000, status: "completed" });
    expect(plan.at(-1)?.kind).toBe("work");
  });
});

describe("classroom settings", () => {
  it("rejects blank, fractional, exponent, negative and out-of-range inputs", () => {
    for (const seconds of ["", " ", "1.5", "1e1", "-1", "60"])
      expect(
        parseClassroom({
          ...classroomFields(defaultClassroomSettings),
          seconds,
        }).error,
      ).toBeTruthy();
    expect(
      parseClassroom({
        ...classroomFields(defaultClassroomSettings),
        minutes: "100",
      }).error,
    ).toBeTruthy();
    expect(
      validateClassroom({ ...defaultClassroomSettings, rounds: 31 }),
    ).toBeTruthy();
    expect(
      validateClassroom({
        ...defaultClassroomSettings,
        minutes: 0,
        seconds: 0,
      }),
    ).toBeTruthy();
    expect(
      validateClassroom({
        ...defaultClassroomSettings,
        minutes: 59,
        seconds: 59,
        rounds: 30,
      }),
    ).toBeTruthy();
  });
  it("validates persisted settings before reuse and only defaults missing data", () => {
    expect(decodeClassroom(null)).toEqual(defaultClassroomSettings);
    expect(() => decodeClassroom('{"minutes":3}')).toThrow();
    expect(() => decodeClassroom("bad JSON")).toThrow();
    expect(
      parseClassroom(classroomFields(defaultClassroomSettings)).settings,
    ).toEqual(defaultClassroomSettings);
  });
});
