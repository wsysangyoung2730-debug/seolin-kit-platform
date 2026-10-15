import { planError, type TimerStep } from "./timer-engine";
export type ClassroomSettings = {
  minutes: number;
  seconds: number;
  preparation: number;
  rest: number;
  rounds: number;
  sound: boolean;
};
export const defaultClassroomSettings: ClassroomSettings = {
  minutes: 3,
  seconds: 0,
  preparation: 5,
  rest: 0,
  rounds: 1,
  sound: true,
};
export type ClassroomFields = {
  [K in Exclude<keyof ClassroomSettings, "sound">]: string;
} & { sound: boolean };
export const classroomFields = (value: ClassroomSettings): ClassroomFields => ({
  minutes: String(value.minutes),
  seconds: String(value.seconds),
  preparation: String(value.preparation),
  rest: String(value.rest),
  rounds: String(value.rounds),
  sound: value.sound,
});
const bounds = {
  minutes: [0, 59, "분은 0~59"],
  seconds: [0, 59, "초는 0~59"],
  preparation: [0, 60, "준비 시간은 0~60"],
  rest: [0, 600, "휴식 시간은 0~600"],
  rounds: [1, 30, "반복 횟수는 1~30"],
} as const;
export function validateClassroom(value: unknown): string | null {
  if (typeof value !== "object" || value === null)
    return "저장된 타이머 설정이 올바르지 않아요.";
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(bounds) as (keyof typeof bounds)[]) {
    const [min, max, label] = bounds[key];
    if (
      typeof record[key] !== "number" ||
      !Number.isInteger(record[key]) ||
      (record[key] as number) < min ||
      (record[key] as number) > max
    )
      return `${label} 사이의 정수로 입력해 주세요.`;
  }
  if (typeof record.sound !== "boolean") return "효과음 설정을 확인해 주세요.";
  if ((record.minutes as number) * 60 + (record.seconds as number) < 1)
    return "수업 시간은 1초 이상 설정해 주세요.";
  return planError(buildClassroomPlan(record as ClassroomSettings));
}
export function parseClassroom(fields: ClassroomFields): {
  settings: ClassroomSettings | null;
  error: string | null;
} {
  for (const key of Object.keys(bounds) as (keyof typeof bounds)[]) {
    if (!/^\d+$/.test(fields[key]))
      return {
        settings: null,
        error: `${bounds[key][2]} 사이의 정수로 입력해 주세요.`,
      };
  }
  const settings = {
    minutes: Number(fields.minutes),
    seconds: Number(fields.seconds),
    preparation: Number(fields.preparation),
    rest: Number(fields.rest),
    rounds: Number(fields.rounds),
    sound: fields.sound,
  };
  const error = validateClassroom(settings);
  return { settings: error ? null : settings, error };
}
export function decodeClassroom(raw: string | null): ClassroomSettings {
  if (raw === null) return { ...defaultClassroomSettings };
  const value: unknown = JSON.parse(raw);
  const error = validateClassroom(value);
  if (error) throw new Error(error);
  return value as ClassroomSettings;
}
export function buildClassroomPlan(value: ClassroomSettings): TimerStep[] {
  const plan: TimerStep[] = [];
  if (value.preparation > 0)
    plan.push({
      label: "준비",
      kind: "prepare",
      seconds: value.preparation,
      round: 1,
      totalRounds: value.rounds,
    });
  for (let round = 1; round <= value.rounds; round++) {
    plan.push({
      label: "수업",
      kind: "work",
      seconds: value.minutes * 60 + value.seconds,
      round,
      totalRounds: value.rounds,
    });
    if (round < value.rounds && value.rest > 0)
      plan.push({
        label: "휴식",
        kind: "rest",
        seconds: value.rest,
        round,
        totalRounds: value.rounds,
      });
  }
  return plan;
}
