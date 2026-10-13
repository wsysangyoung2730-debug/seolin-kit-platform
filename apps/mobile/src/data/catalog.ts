import type { MiniApp } from "@seolin/contracts";
export const categories = [
  { id: "all", name: "전체", icon: "grid" },
  { id: "game", name: "게임", icon: "game" },
  { id: "education", name: "교육", icon: "book" },
  { id: "editing", name: "편집", icon: "edit" },
  { id: "classroom", name: "수업 도구", icon: "kit" },
] as const;
export const catalog: MiniApp[] = [
  {
    id: "ox",
    name: "O/X 게임",
    summary: "생각하고, 움직이고, 함께 맞히는 퀴즈",
    description:
      "우리 수업에 맞는 문제를 직접 만들고 O와 X로 답해요. 휴대폰이나 태블릿을 TV에 미러링하면 큰 화면으로 함께 즐길 수 있어요.",
    category: "game",
    status: "available",
    access: "free",
    runtime: "native",
  },
  {
    id: "breaking",
    name: "가상격파",
    summary: "수업을 신나게 만드는 격파 챌린지",
    description:
      "가상 격파 수업 도구를 준비하고 있어요. 공개 후 자세한 사용 방법을 안내할게요.",
    category: "game",
    status: "coming-soon",
    access: "undecided",
    runtime: "native",
  },
  {
    id: "freeze",
    name: "무궁화꽃이 피었습니다",
    summary: "집중력과 순발력을 키우는 놀이",
    description: "아이들과 함께하는 멈춤 놀이를 준비하고 있어요.",
    category: "game",
    status: "coming-soon",
    access: "undecided",
    runtime: "native",
  },
  {
    id: "initials",
    name: "초성퀴즈",
    summary: "초성을 보고 함께 정답을 찾아요",
    description: "수업 주제에 맞는 단어로 즐기는 초성퀴즈를 준비하고 있어요.",
    category: "education",
    status: "coming-soon",
    access: "undecided",
    runtime: "native",
  },
];
export function filterCatalog(query: string, category: string) {
  const normalized = query.trim().toLocaleLowerCase();
  return catalog.filter(
    (app) =>
      (category === "all" || app.category === category) &&
      `${app.name} ${app.summary}`.toLocaleLowerCase().includes(normalized),
  );
}
export function decodeLibrary(raw: string | null): string[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string"))
    throw new Error("보관함 형식 오류");
  return [...new Set(value)].filter((id) =>
    catalog.some((app) => app.id === id),
  );
}
