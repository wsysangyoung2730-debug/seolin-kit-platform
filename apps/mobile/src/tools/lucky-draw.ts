export type LuckyModeId =
  | "capsule"
  | "roulette"
  | "mitts"
  | "lockers"
  | "scrolls"
  | "uniforms"
  | "medals"
  | "tiger"
  | "rotating";
export type LuckyMode = {
  id: LuckyModeId;
  label: string;
  mood: string;
  instruction: string;
};
export const modes: readonly LuckyMode[] = [
  {
    id: "capsule",
    label: "캡슐 뽑기",
    mood: "작은 캡슐 속 선물",
    instruction: "발차기 버튼을 눌러 캡슐을 꺼내요.",
  },
  {
    id: "roulette",
    label: "돌려차기 룰렛",
    mood: "두근두근 한 바퀴",
    instruction: "룰렛을 돌려 오늘의 행운을 만나요.",
  },
  {
    id: "mitts",
    label: "미트 뽑기",
    mood: "하나를 골라 터치!",
    instruction: "원하는 미트를 눌러 선택해요.",
  },
  {
    id: "lockers",
    label: "사물함 뽑기",
    mood: "어느 문에 들어 있을까?",
    instruction: "사물함 하나를 골라 문을 열어요.",
  },
  {
    id: "scrolls",
    label: "승급심사 두루마리",
    mood: "돌돌 말린 비밀",
    instruction: "두루마리를 골라 펼쳐 봐요.",
  },
  {
    id: "uniforms",
    label: "도복 뽑기",
    mood: "도복에 담긴 행운",
    instruction: "마음에 드는 도복을 골라요.",
  },
  {
    id: "medals",
    label: "메달 뽑기",
    mood: "반짝이는 오늘의 보상",
    instruction: "메달 하나를 선택해 상품을 확인해요.",
  },
  {
    id: "tiger",
    label: "호랑이 기합",
    mood: "힘차게, 얍!",
    instruction: "기합 버튼을 눌러 호랑이를 깨워요.",
  },
  {
    id: "rotating",
    label: "회전 송판",
    mood: "돌아가는 선택의 순간",
    instruction: "회전을 시작하고 멈추기 버튼을 눌러요.",
  },
];
export type Prize = {
  id: string;
  name: string;
  quantity: number;
  kind: "prize" | "miss";
};
export type DrawResult = {
  id: string;
  createdAt: string;
  mode: LuckyModeId;
  prizeId: string;
  prizeName: string;
  kind: Prize["kind"];
  selectedIndex?: number;
};
export type LuckyState = {
  version: 1;
  prizes: Prize[];
  remaining: Record<string, number>;
  history: DrawResult[];
};
export type PrizeDraft = {
  id: string;
  name: string;
  quantity: string;
  kind: Prize["kind"];
};
export const LIMITS = {
  prizes: 20,
  quantity: 100,
  total: 1000,
  name: 30,
} as const;
const ids = new Set(modes.map((mode) => mode.id));
export const isLuckyMode = (value: unknown): value is LuckyModeId =>
  typeof value === "string" && ids.has(value as LuckyModeId);
export function newLuckyId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
export function prizeError(value: unknown): string | null {
  if (!Array.isArray(value) || !value.length || value.length > LIMITS.prizes)
    return "상품은 1~20종으로 구성해 주세요.";
  const used = new Set<string>();
  let total = 0;
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof item.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) ||
      used.has(item.id)
    )
      return "상품 정보를 확인해 주세요.";
    used.add(item.id);
    if (
      typeof item.name !== "string" ||
      !item.name.trim() ||
      item.name.trim().length > LIMITS.name
    )
      return "상품 이름은 1~30자로 입력해 주세요.";
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > LIMITS.quantity
    )
      return "각 상품 수량은 1~100 사이의 정수로 입력해 주세요.";
    if (item.kind !== "prize" && item.kind !== "miss")
      return "상품과 다음 기회 구분을 확인해 주세요.";
    total += item.quantity;
  }
  return total > LIMITS.total
    ? "전체 수량은 1,000개까지 설정할 수 있어요."
    : null;
}
export function createLuckyState(prizes: Prize[]): LuckyState {
  const error = prizeError(prizes);
  if (error) throw new Error(error);
  const clean = prizes.map((prize) => ({ ...prize, name: prize.name.trim() }));
  return {
    version: 1,
    prizes: clean,
    remaining: Object.fromEntries(
      clean.map((prize) => [prize.id, prize.quantity]),
    ),
    history: [],
  };
}
export function defaultLuckyState(): LuckyState {
  return createLuckyState([
    { id: "sticker", name: "칭찬 스티커", quantity: 5, kind: "prize" },
    { id: "applause", name: "모두의 박수", quantity: 10, kind: "prize" },
    { id: "next-time", name: "다음 기회", quantity: 5, kind: "miss" },
  ]);
}
export const remainingTotal = (state: LuckyState) =>
  state.prizes.reduce(
    (sum, prize) => sum + (state.remaining[prize.id] ?? 0),
    0,
  );
export const prizeDrafts = (prizes: Prize[]): PrizeDraft[] =>
  prizes.map((prize) => ({ ...prize, quantity: String(prize.quantity) }));
export function parsePrizeDrafts(drafts: PrizeDraft[]): Prize[] {
  if (drafts.some((draft) => !/^\d+$/.test(draft.quantity)))
    throw new Error("수량은 빈칸이나 소수 없이 정수로 입력해 주세요.");
  const prizes = drafts.map((draft) => ({
    ...draft,
    name: draft.name.trim(),
    quantity: Number(draft.quantity),
  }));
  const error = prizeError(prizes);
  if (error) throw new Error(error);
  return prizes;
}
export function decodeLucky(raw: string | null): LuckyState {
  if (raw === null) return defaultLuckyState();
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || !value)
    throw new Error("저장 형식을 확인해 주세요.");
  const state = value as LuckyState;
  if (
    state.version !== 1 ||
    prizeError(state.prizes) ||
    typeof state.remaining !== "object" ||
    !state.remaining ||
    Array.isArray(state.remaining) ||
    !Array.isArray(state.history) ||
    state.history.length > LIMITS.total
  )
    throw new Error("저장된 뽑기 정보가 올바르지 않아요.");
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const result of state.history) {
    if (
      !result ||
      typeof result !== "object" ||
      typeof result.id !== "string" ||
      !result.id ||
      seen.has(result.id) ||
      typeof result.createdAt !== "string" ||
      !Number.isFinite(Date.parse(result.createdAt)) ||
      !isLuckyMode(result.mode)
    )
      throw new Error("저장된 결과 기록이 올바르지 않아요.");
    const prize = state.prizes.find((item) => item.id === result.prizeId);
    if (
      !prize ||
      result.prizeName !== prize.name ||
      result.kind !== prize.kind ||
      (result.selectedIndex !== undefined &&
        (!Number.isInteger(result.selectedIndex) ||
          result.selectedIndex < 0 ||
          result.selectedIndex > 999))
    )
      throw new Error("상품과 결과 기록이 맞지 않아요.");
    seen.add(result.id);
    counts.set(prize.id, (counts.get(prize.id) ?? 0) + 1);
  }
  if (Object.keys(state.remaining).length !== state.prizes.length)
    throw new Error("남은 수량 정보가 올바르지 않아요.");
  for (const prize of state.prizes) {
    if (
      !Number.isInteger(state.remaining[prize.id]) ||
      state.remaining[prize.id] !==
        prize.quantity - (counts.get(prize.id) ?? 0) ||
      state.remaining[prize.id]! < 0
    )
      throw new Error("남은 수량과 결과 기록이 맞지 않아요.");
  }
  return state;
}
export function drawLucky(
  state: LuckyState,
  mode: LuckyModeId,
  options: {
    random?: () => number;
    id?: string;
    createdAt?: string;
    selectedIndex?: number;
  } = {},
): { state: LuckyState; result: DrawResult } {
  if (!isLuckyMode(mode)) throw new Error("뽑기 방식을 다시 선택해 주세요.");
  const total = remainingTotal(state);
  if (!total)
    throw new Error("준비한 수량을 모두 뽑았어요. 새 회차를 준비해 주세요.");
  const random = (options.random ?? Math.random)();
  if (!Number.isFinite(random) || random < 0 || random >= 1)
    throw new Error("추첨값을 확인해 주세요.");
  if (
    options.selectedIndex !== undefined &&
    (!Number.isInteger(options.selectedIndex) ||
      options.selectedIndex < 0 ||
      options.selectedIndex > 999)
  )
    throw new Error("선택 위치를 확인해 주세요.");
  let ticket = Math.floor(random * total);
  let selected: Prize | undefined;
  for (const prize of state.prizes) {
    const quantity = state.remaining[prize.id] ?? 0;
    if (ticket < quantity) {
      selected = prize;
      break;
    }
    ticket -= quantity;
  }
  if (!selected) throw new Error("남은 수량을 확인해 주세요.");
  const id = options.id ?? newLuckyId();
  const createdAt = options.createdAt ?? new Date().toISOString();
  if (
    !id ||
    state.history.some((result) => result.id === id) ||
    !Number.isFinite(Date.parse(createdAt))
  )
    throw new Error("결과 기록을 만들지 못했어요. 다시 시도해 주세요.");
  const result: DrawResult = {
    id,
    createdAt,
    mode,
    prizeId: selected.id,
    prizeName: selected.name,
    kind: selected.kind,
    ...(options.selectedIndex === undefined
      ? {}
      : { selectedIndex: options.selectedIndex }),
  };
  return {
    result,
    state: {
      ...state,
      remaining: {
        ...state.remaining,
        [selected.id]: state.remaining[selected.id]! - 1,
      },
      history: [...state.history, result],
    },
  };
}
