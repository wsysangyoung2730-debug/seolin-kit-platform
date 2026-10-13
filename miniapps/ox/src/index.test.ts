import { describe, it, expect } from "vitest";
import {
  defaultLesson,
  decodeLesson,
  parseQuestions,
  transition,
  initialGame,
} from "./index";
const lesson = {
  ...defaultLesson,
  questions: defaultLesson.questions.slice(0, 2),
};
describe("lesson data", () => {
  it("round trips and rejects invalid persisted settings", () => {
    expect(decodeLesson(JSON.stringify(lesson))).toEqual(lesson);
    for (const seconds of [0, 61, NaN, 1.5])
      expect(() =>
        decodeLesson(JSON.stringify({ ...lesson, seconds })),
      ).toThrow();
    expect(() => decodeLesson("{")).toThrow();
    expect(() =>
      decodeLesson(JSON.stringify({ ...lesson, questions: [] })),
    ).toThrow();
  });
  it("parses explicit answers and fails the entire import on any bad line", () => {
    expect(
      parseQuestions("하늘은 파랗다 | o\n준비 운동 | X").map((q) => q.answer),
    ).toEqual(["O", "X"]);
    expect(() => parseQuestions("문제 | O\n정답 없는 문제")).toThrow("2번째");
  });
});
describe("classroom lifecycle", () => {
  it("manual mode never exposes answers before instructor reveal", () => {
    let s = transition(initialGame(lesson), { type: "start", now: 0 }, lesson);
    s = transition(s, { type: "tick", now: 5001 }, lesson);
    expect(s.phase).toBe("waiting");
    s = transition(s, { type: "tick", now: 90000 }, lesson);
    expect(s.phase).toBe("waiting");
    s = transition(s, { type: "reveal", now: 90001 }, lesson);
    expect(s.phase).toBe("revealed");
    s = transition(s, { type: "next", now: 90002 }, lesson);
    expect(s).toMatchObject({ index: 1, phase: "ready" });
  });
  it("pauses elapsed countdown while backgrounded and resumes remaining time", () => {
    let s = transition(
      initialGame(lesson),
      { type: "start", now: 1000 },
      lesson,
    );
    s = transition(s, { type: "pause", now: 2500 }, lesson);
    expect(s.remaining).toBe(3500);
    expect(transition(s, { type: "tick", now: 50000 }, lesson)).toEqual(s);
    s = transition(s, { type: "resume", now: 50000 }, lesson);
    expect(s.deadline).toBe(53500);
    expect(transition(s, { type: "tick", now: 53499 }, lesson).phase).toBe(
      "counting",
    );
  });
  it("auto mode holds answer for 3 seconds then advances and finishes", () => {
    const auto = { ...lesson, automatic: true };
    let s = transition(initialGame(auto), { type: "start", now: 0 }, auto);
    s = transition(s, { type: "tick", now: 5000 }, auto);
    expect(s.phase).toBe("revealed");
    s = transition(s, { type: "tick", now: 8000 }, auto);
    expect(s).toMatchObject({ phase: "counting", index: 1 });
    s = transition(s, { type: "tick", now: 13000 }, auto);
    s = transition(s, { type: "tick", now: 16000 }, auto);
    expect(s.phase).toBe("done");
    expect(s.deadline).toBeNull();
  });
  it("pauses auto-reveal and ignores commands while paused", () => {
    const auto = { ...lesson, automatic: true };
    let s = transition(initialGame(auto), { type: "start", now: 0 }, auto);
    s = transition(s, { type: "tick", now: 5000 }, auto);
    s = transition(s, { type: "pause", now: 6000 }, auto);
    expect(s.remaining).toBe(2000);
    expect(transition(s, { type: "next", now: 10000 }, auto)).toEqual(s);
    s = transition(s, { type: "resume", now: 11000 }, auto);
    expect(s.deadline).toBe(13000);
  });
  it("previous resets timing and restart removes the prior session", () => {
    const state = {
      ...initialGame(lesson),
      index: 1,
      phase: "revealed" as const,
    };
    expect(transition(state, { type: "previous", now: 0 }, lesson)).toEqual(
      initialGame(lesson),
    );
    expect(transition(state, { type: "restart", now: 0 }, lesson)).toEqual(
      initialGame(lesson),
    );
  });
});
