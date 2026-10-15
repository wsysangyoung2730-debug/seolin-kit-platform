export const STORAGE_KEY = "seolin-board-break-v1";
export interface Settings {
  prize: string;
  winningBoards: number;
  sound: boolean;
}
export interface Draw {
  id: string;
  at: string;
  board: number;
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
    settings: { prize: "오늘의 선물", winningBoards: 1, sound: true },
    history: [],
  };
}
export function injectInitialState(html: string, value: unknown): string {
  return html.replace('"__INITIAL_BREAKING_STATE__"', () =>
    JSON.stringify(value ?? null).replace(/</g, "\\u003c"),
  );
}
export function decodeState(raw: string | null): SavedState {
  if (raw === null) return freshState();
  const s = JSON.parse(raw) as SavedState;
  if (
    !s ||
    s.version !== 1 ||
    !s.settings ||
    !Array.isArray(s.history) ||
    s.history.length > 50
  )
    throw new Error("저장 형식 오류");
  const p = s.settings;
  if (
    typeof p.prize !== "string" ||
    !p.prize.trim() ||
    p.prize.length > 40 ||
    typeof p.sound !== "boolean" ||
    !Number.isInteger(p.winningBoards) ||
    p.winningBoards < 0 ||
    p.winningBoards > 3
  )
    throw new Error("설정 형식 오류");
  for (const d of s.history)
    if (
      !d ||
      typeof d.id !== "string" ||
      d.id.length > 80 ||
      typeof d.at !== "string" ||
      !Number.isFinite(Date.parse(d.at)) ||
      !Number.isInteger(d.board) ||
      d.board < 0 ||
      d.board > 2 ||
      typeof d.won !== "boolean" ||
      typeof d.prize !== "string" ||
      d.prize.length > 40
    )
      throw new Error("기록 형식 오류");
  return {
    version: 1,
    settings: { ...p },
    history: s.history.map((d) => ({ ...d })),
  };
}
/** Rejection sampling avoids modulo bias when shuffling the three hidden results. */
export function randomIndex(
  size: number,
  next: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0]!,
): number {
  if (!Number.isInteger(size) || size < 1 || size > 3)
    throw new Error("추첨 크기 오류");
  const limit = Math.floor(4294967296 / size) * size;
  let n: number;
  do {
    n = next();
  } while (n >= limit);
  return n % size;
}
export function createRound(
  winningBoards: number,
  pick = randomIndex,
): boolean[] {
  if (
    !Number.isInteger(winningBoards) ||
    winningBoards < 0 ||
    winningBoards > 3
  )
    throw new Error("당첨 송판 수 오류");
  const boards = [0, 1, 2].map((i) => i < winningBoards);
  for (let i = 2; i > 0; i--) {
    const j = pick(i + 1);
    [boards[i], boards[j]] = [boards[j]!, boards[i]!];
  }
  return boards;
}
export function recordDraw(
  state: SavedState,
  board: number,
  won: boolean,
  id: string,
  at: string,
): SavedState {
  if (!Number.isInteger(board) || board < 0 || board > 2)
    throw new Error("송판 번호 오류");
  return {
    ...state,
    history: [
      {
        id,
        at,
        board,
        won,
        prize: won ? state.settings.prize : "다음 기회에!",
      },
      ...state.history,
    ].slice(0, 50),
  };
}
