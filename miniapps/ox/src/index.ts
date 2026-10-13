export type Answer = "O" | "X";
export interface Question {
  id: string;
  text: string;
  answer: Answer;
}
export interface Lesson {
  version: 1;
  title: string;
  questions: Question[];
  seconds: number;
  automatic: boolean;
  sound: boolean;
}
export const defaultLesson: Lesson = {
  version: 1,
  title: "함께하는 O/X 수업",
  seconds: 5,
  automatic: false,
  sound: true,
  questions: [
    { id: "q1", text: "태권도는 올림픽 종목이다.", answer: "O" },
    {
      id: "q2",
      text: "수련을 시작하기 전에는 준비 운동을 생략해도 된다.",
      answer: "X",
    },
    { id: "q3", text: "친구와 함께 수련할 때는 서로 배려한다.", answer: "O" },
  ],
};
export function lessonError(value: Lesson): string {
  if (!value.title.trim() || value.title.length > 60)
    return "수업 이름을 1~60자로 입력해 주세요.";
  if (
    !Number.isInteger(value.seconds) ||
    value.seconds < 1 ||
    value.seconds > 60
  )
    return "제한 시간은 1~60초로 설정해 주세요.";
  if (!value.questions.length || value.questions.length > 100)
    return "문제는 1~100개까지 준비할 수 있어요.";
  if (
    value.questions.some(
      (q) =>
        !q.text.trim() || q.text.length > 200 || !["O", "X"].includes(q.answer),
    )
  )
    return "각 문제를 1~200자로 입력하고 정답을 선택해 주세요.";
  if (new Set(value.questions.map((q) => q.id)).size !== value.questions.length)
    return "문제 번호가 중복됐어요.";
  return "";
}
export function copyLesson(lesson: Lesson): Lesson {
  return { ...lesson, questions: lesson.questions.map((q) => ({ ...q })) };
}
export function decodeLesson(raw: string | null): Lesson {
  if (raw === null) return copyLesson(defaultLesson);
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("수업 형식 오류");
  const v = value as Record<string, unknown>;
  if (
    v.version !== 1 ||
    typeof v.title !== "string" ||
    typeof v.seconds !== "number" ||
    typeof v.automatic !== "boolean" ||
    typeof v.sound !== "boolean" ||
    !Array.isArray(v.questions) ||
    !v.questions.every(
      (q) =>
        q &&
        typeof q === "object" &&
        typeof q.id === "string" &&
        typeof q.text === "string" &&
        (q.answer === "O" || q.answer === "X"),
    )
  )
    throw new Error("수업 형식 오류");
  const lesson = v as unknown as Lesson;
  const error = lessonError(lesson);
  if (error) throw new Error(error);
  return lesson;
}
// Explicit delimiter avoids silently guessing an answer from the question text.
export function parseQuestions(text: string): Question[] {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!lines.length || lines.length > 100)
    throw new Error("1~100줄의 문제를 입력해 주세요.");
  return lines.map((line, i) => {
    const match = line.match(/^(.+?)\s*\|\s*([oOxX○×])$/);
    if (!match || !match[1]?.trim() || match[1].trim().length > 200)
      throw new Error(
        `${i + 1}번째 줄을 확인해 주세요. 문제 | O 또는 문제 | X 형식이에요.`,
      );
    return {
      id: `import-${i}`,
      text: match[1].trim(),
      answer: ["o", "O", "○"].includes(match[2]!) ? "O" : "X",
    };
  });
}
export type Phase = "ready" | "counting" | "waiting" | "revealed" | "done";
export interface Game {
  index: number;
  phase: Phase;
  paused: boolean;
  remaining: number;
  deadline: number | null;
}
export type Event = {
  type:
    | "start"
    | "tick"
    | "pause"
    | "resume"
    | "reveal"
    | "next"
    | "previous"
    | "restart";
  now: number;
};
export function initialGame(lesson: Lesson): Game {
  return {
    index: 0,
    phase: "ready",
    paused: false,
    remaining: lesson.seconds * 1000,
    deadline: null,
  };
}
export function transition(state: Game, event: Event, lesson: Lesson): Game {
  const { now, type } = event;
  const ready = (index: number): Game => ({ ...initialGame(lesson), index });
  const counting = (index: number): Game => ({
    index,
    phase: "counting",
    paused: false,
    remaining: lesson.seconds * 1000,
    deadline: now + lesson.seconds * 1000,
  });
  if (type === "restart") return initialGame(lesson);
  if (type === "pause")
    return state.phase === "done" || state.paused
      ? state
      : {
          ...state,
          paused: true,
          remaining:
            state.deadline === null
              ? state.remaining
              : Math.max(0, state.deadline - now),
          deadline: null,
        };
  if (type === "resume")
    return !state.paused
      ? state
      : {
          ...state,
          paused: false,
          deadline:
            state.phase === "counting" ||
            (state.phase === "revealed" && lesson.automatic)
              ? now + state.remaining
              : null,
        };
  if (state.paused) return state;
  if (type === "start" && state.phase === "ready") return counting(state.index);
  if (type === "previous" && state.index > 0) return ready(state.index - 1);
  if (type === "next" && state.phase === "revealed")
    return state.index + 1 >= lesson.questions.length
      ? { ...state, phase: "done", deadline: null }
      : ready(state.index + 1);
  if (
    type === "reveal" &&
    (state.phase === "waiting" || state.phase === "counting")
  )
    return {
      ...state,
      phase: "revealed",
      remaining: 3000,
      deadline: lesson.automatic ? now + 3000 : null,
    };
  if (type === "tick" && state.deadline !== null) {
    if (now < state.deadline)
      return { ...state, remaining: state.deadline - now };
    if (state.phase === "counting")
      return {
        ...state,
        phase: lesson.automatic ? "revealed" : "waiting",
        remaining: lesson.automatic ? 3000 : 0,
        deadline: lesson.automatic ? now + 3000 : null,
      };
    if (state.phase === "revealed" && lesson.automatic)
      return state.index + 1 >= lesson.questions.length
        ? { ...state, phase: "done", deadline: null }
        : counting(state.index + 1);
  }
  return state;
}
