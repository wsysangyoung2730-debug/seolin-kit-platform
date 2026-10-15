export const STORAGE_KEY = "seolin-taekwondo-pinball-v1";
/** Preserve literal replacement characters and keep user text out of HTML tags. */
export function injectInitialState(html: string, value: unknown): string {
  const json = JSON.stringify(value ?? null).replace(/</g, "\\u003c");
  return html.replace('"__INITIAL_PINBALL_STATE__"', () => json);
}
export interface Settings {
  winningBins: number;
  prize: string;
  sound: boolean;
}
export interface Draw {
  id: string;
  at: string;
  lane: number;
  won: boolean;
  prize: string;
}
export interface SavedState {
  version: 1;
  settings: Settings;
  history: Draw[];
}
export function freshState(): SavedState {
  return {
    version: 1,
    settings: { winningBins: 2, prize: "오늘의 선물", sound: true },
    history: [],
  };
}
export function winningLanes(count: number): number[] {
  const layouts: number[][] = [
    [],
    [2],
    [1, 3],
    [0, 2, 4],
    [0, 1, 3, 4],
    [0, 1, 2, 3, 4],
  ];
  if (!Number.isInteger(count) || count < 0 || count > 5)
    throw new Error("당첨 칸은 0~5개로 설정해 주세요.");
  return layouts[count]!;
}
export function laneAt(x: number) {
  if (!Number.isFinite(x)) throw new Error("공 위치 오류");
  return Math.max(0, Math.min(4, Math.floor((x + 3.25) / 1.3)));
}
export function decodeState(raw: string | null): SavedState {
  if (raw === null) return freshState();
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("저장 형식 오류");
  const v = value as Partial<SavedState>;
  if (
    v.version !== 1 ||
    !v.settings ||
    !Array.isArray(v.history) ||
    v.history.length > 50
  )
    throw new Error("저장 형식 오류");
  winningLanes(v.settings.winningBins);
  if (
    typeof v.settings.prize !== "string" ||
    !v.settings.prize.trim() ||
    v.settings.prize.length > 40 ||
    typeof v.settings.sound !== "boolean"
  )
    throw new Error("설정 형식 오류");
  for (const d of v.history) {
    if (
      !d ||
      typeof d.id !== "string" ||
      d.id.length > 80 ||
      typeof d.at !== "string" ||
      !Number.isFinite(Date.parse(d.at)) ||
      !Number.isInteger(d.lane) ||
      d.lane < 0 ||
      d.lane > 4 ||
      typeof d.won !== "boolean" ||
      typeof d.prize !== "string" ||
      d.prize.length > 40
    )
      throw new Error("기록 형식 오류");
  }
  return {
    version: 1,
    settings: { ...v.settings },
    history: v.history.map((d) => ({ ...d })),
  };
}
export function recordDraw(
  state: SavedState,
  lane: number,
  id: string,
  at: string,
): SavedState {
  if (!Number.isInteger(lane) || lane < 0 || lane > 4)
    throw new Error("결과 칸 오류");
  const won = winningLanes(state.settings.winningBins).includes(lane);
  const draw = {
    id,
    at,
    lane,
    won,
    prize: won ? state.settings.prize : "다음 기회에!",
  };
  return { ...state, history: [draw, ...state.history].slice(0, 50) };
}
