import type { TimerStep } from "./timer-engine";

export interface TabataSettings {
  prepareSeconds: number;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  sound: boolean;
}

export const TABATA_STORAGE_KEY = "seolin.tools.tabata.v1";
export const MAX_TABATA_SECONDS = 12 * 60 * 60;
export const defaultTabata: Readonly<TabataSettings> = {
  prepareSeconds: 10,
  workSeconds: 20,
  restSeconds: 10,
  rounds: 8,
  sound: true,
};

export function tabataTotalSeconds(settings: TabataSettings): number {
  return (
    settings.prepareSeconds +
    settings.workSeconds * settings.rounds +
    settings.restSeconds * Math.max(0, settings.rounds - 1)
  );
}

export function tabataSettingsError(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "타바타 설정을 확인해 주세요.";
  }
  const settings = value as Record<string, unknown>;
  const ranges = [
    ["prepareSeconds", 0, 60, "준비 시간은 0~60초의 정수로 입력해 주세요."],
    ["workSeconds", 1, 3600, "운동 시간은 1~3,600초의 정수로 입력해 주세요."],
    ["restSeconds", 0, 3600, "휴식 시간은 0~3,600초의 정수로 입력해 주세요."],
    ["rounds", 1, 99, "세트 수는 1~99의 정수로 입력해 주세요."],
  ] as const;
  for (const [key, min, max, error] of ranges) {
    const field = settings[key];
    if (
      typeof field !== "number" ||
      !Number.isInteger(field) ||
      field < min ||
      field > max
    )
      return error;
  }
  if (typeof settings.sound !== "boolean") {
    return "소리 안내 설정을 확인해 주세요.";
  }
  if (tabataTotalSeconds(value as TabataSettings) > MAX_TABATA_SECONDS) {
    return "총 진행 시간은 12시간 이내로 설정해 주세요.";
  }
  return null;
}

export function createTabataPlan(settings: TabataSettings): TimerStep[] {
  const error = tabataSettingsError(settings);
  if (error) throw new RangeError(error);
  const steps: TimerStep[] = [];
  if (settings.prepareSeconds > 0) {
    steps.push({
      label: "준비",
      seconds: settings.prepareSeconds,
      round: 1,
      totalRounds: settings.rounds,
      kind: "prepare",
    });
  }
  for (let round = 1; round <= settings.rounds; round += 1) {
    steps.push({
      label: "운동",
      seconds: settings.workSeconds,
      round,
      totalRounds: settings.rounds,
      kind: "work",
    });
    if (round < settings.rounds && settings.restSeconds > 0) {
      steps.push({
        label: "휴식",
        seconds: settings.restSeconds,
        round,
        totalRounds: settings.rounds,
        kind: "rest",
      });
    }
  }
  return steps;
}

export function decodeTabataSettings(raw: string | null): TabataSettings {
  if (raw === null) return { ...defaultTabata };
  const saved: unknown = JSON.parse(raw);
  if (
    !saved ||
    typeof saved !== "object" ||
    !("version" in saved) ||
    saved.version !== 1 ||
    !("settings" in saved)
  )
    throw new Error("저장된 타바타 설정의 형식을 읽을 수 없어요.");
  const error = tabataSettingsError(saved.settings);
  if (error) throw new Error(error);
  const settings = saved.settings as TabataSettings;
  return {
    prepareSeconds: settings.prepareSeconds,
    workSeconds: settings.workSeconds,
    restSeconds: settings.restSeconds,
    rounds: settings.rounds,
    sound: settings.sound,
  };
}

export function encodeTabataSettings(settings: TabataSettings): string {
  const error = tabataSettingsError(settings);
  if (error) throw new RangeError(error);
  return JSON.stringify({ version: 1, settings });
}

export function parseTabataInteger(text: string): number {
  return /^\d+$/.test(text.trim()) ? Number(text.trim()) : Number.NaN;
}

export function formatTabataDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return [
    hours > 0 && `${hours}시간`,
    minutes > 0 && `${minutes}분`,
    (remaining > 0 || seconds === 0) && `${remaining}초`,
  ]
    .filter(Boolean)
    .join(" ");
}
