export const ROSTER_KEY = "seolin.tools.teams.roster.v1";
export const MAX_PEOPLE = 100;
export const MAX_NAME_LENGTH = 30;

export type Participant = { id: string; name: string; label: string };
export type DrawRound = { people: Participant[] };
export type Result<T> =
  { value: T; error?: never } | { value?: never; error: string };

/** Blank lines are ignored; every nonblank line represents a separate person. */
export function parseRoster(text: string): Result<Participant[]> {
  const names = text
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
  if (!names.length) return { error: "이름을 한 줄에 한 명씩 입력해 주세요." };
  if (names.length > MAX_PEOPLE)
    return {
      error: `명단은 ${MAX_PEOPLE}명까지 입력할 수 있어요. 현재 ${names.length}명이에요.`,
    };
  for (const [index, name] of names.entries()) {
    if (Array.from(name).length > MAX_NAME_LENGTH) {
      return {
        error: `${index + 1}번째 이름은 ${MAX_NAME_LENGTH}자 이내로 입력해 주세요.`,
      };
    }
    if (
      /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/u.test(
        name,
      )
    ) {
      return {
        error: `${index + 1}번째 이름에 사용할 수 없는 제어 문자가 있어요.`,
      };
    }
  }
  const frequencies = new Map<string, number>();
  for (const name of names)
    frequencies.set(name, (frequencies.get(name) ?? 0) + 1);
  return {
    value: names.map((name, index) => ({
      id: `person-${index + 1}`,
      name,
      label: frequencies.get(name)! > 1 ? `${name} · ${index + 1}번` : name,
    })),
  };
}

/** Reject invalid input instead of silently clamping the instructor's choice. */
export function readCount(
  text: string,
  minimum: number,
  maximum: number,
): Result<number> {
  if (maximum < minimum) return { error: `최소 ${minimum}명이 필요해요.` };
  if (!/^\d+$/.test(text.trim()))
    return { error: `${minimum}~${maximum} 사이의 정수를 입력해 주세요.` };
  const count = Number(text.trim());
  if (!Number.isSafeInteger(count) || count < minimum || count > maximum) {
    return { error: `${minimum}~${maximum} 사이의 정수를 입력해 주세요.` };
  }
  return { value: count };
}

/** Fisher–Yates: each remaining participant has the same chance at every step. */
export function shuffled<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1)
      throw new Error("Invalid random sample");
    const target = Math.floor(sample * (index + 1));
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
  }
  return copy;
}

export function makeTeams(
  people: readonly Participant[],
  count: number,
  random?: () => number,
): Participant[][] {
  if (
    !Number.isInteger(count) ||
    count < 2 ||
    count > Math.min(people.length, 20)
  ) {
    throw new Error("팀 수는 2~20개이며 참여 인원보다 많을 수 없어요.");
  }
  const teams: Participant[][] = Array.from({ length: count }, () => []);
  shuffled(people, random).forEach((person, index) =>
    teams[index % count]!.push(person),
  );
  return teams;
}

export function remainingPeople(
  people: readonly Participant[],
  history: readonly DrawRound[],
  excludePrevious: boolean,
): Participant[] {
  if (!excludePrevious) return [...people];
  const picked = new Set(
    history.flatMap((round) => round.people.map((person) => person.id)),
  );
  return people.filter((person) => !picked.has(person.id));
}

export function drawPeople(
  people: readonly Participant[],
  count: number,
  history: readonly DrawRound[],
  excludePrevious: boolean,
  random?: () => number,
): Result<DrawRound> {
  const pool = remainingPeople(people, history, excludePrevious);
  if (!pool.length)
    return {
      error:
        "모두 한 번씩 뽑혔어요. 추첨 기록을 초기화하면 다시 시작할 수 있어요.",
    };
  if (!Number.isInteger(count) || count < 1 || count > pool.length) {
    return {
      error: `현재 뽑을 수 있는 인원은 ${pool.length}명이에요. 추첨 인원을 1~${pool.length}명으로 바꿔 주세요.`,
    };
  }
  return { value: { people: shuffled(pool, random).slice(0, count) } };
}

export function encodeRoster(text: string): string {
  const parsed = parseRoster(text);
  if (parsed.error) throw new Error(parsed.error);
  return JSON.stringify({
    version: 1,
    names: parsed.value!.map((person) => person.name),
  });
}

export function decodeRoster(raw: string | null): string {
  if (raw === null) return "";
  const data: unknown = JSON.parse(raw);
  if (
    !data ||
    typeof data !== "object" ||
    !("version" in data) ||
    data.version !== 1 ||
    !("names" in data) ||
    !Array.isArray(data.names) ||
    data.names.length < 1 ||
    data.names.length > MAX_PEOPLE ||
    data.names.some(
      (name: unknown) =>
        typeof name !== "string" || !name.trim() || /[\r\n]/.test(name),
    )
  ) {
    throw new Error("저장된 명단의 형식이 올바르지 않아요.");
  }
  const text = data.names.join("\n");
  if (parseRoster(text).error) throw new Error("저장된 명단을 확인해 주세요.");
  return text;
}
