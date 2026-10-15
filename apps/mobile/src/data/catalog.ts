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
      "카메라로 움직임을 감지해 풍선과 송판을 격파해요. 비 내리기·곳곳에 나타나기, 황금 풍선·폭탄, 속도·크기·거리·민감도를 조절하고 최고 기록에 도전해요.",
    category: "game",
    status: "available",
    access: "free",
    runtime: "bundled-html",
  },
  {
    id: "freeze",
    name: "무궁화꽃이 피었습니다",
    summary: "움직이고 멈추며 집중력을 키워요",
    description:
      "무궁화 음원에 맞춰 움직이고 멈춰요. 카메라 동작 감지와 위반 표시, 음원·재생 속도·멈춤 시간·감지 민감도·거리 설정을 수업에 맞게 조절해요.",
    category: "game",
    status: "available",
    access: "free",
    runtime: "bundled-html",
  },
  {
    id: "initials",
    name: "초성퀴즈",
    summary: "초성을 보고 함께 정답을 찾아요",
    description:
      "2글자·3글자·혼합 초성과 내장 단어 사전으로 퀴즈를 진행해요. 음성 답변이나 직접 입력, 성공 인정·통과, 문제 시간·정답 수·문제 수를 설정할 수 있어요.",
    category: "education",
    status: "available",
    access: "free",
    runtime: "bundled-html",
  },
  {
    id: "wordchain",
    name: "끝말잇기 배틀",
    summary: "두 팀이 주고받는 짜릿한 단어 대결",
    description:
      "두 팀이 제한 시간 안에 단어를 이어 가요. 두음법칙·중복 단어 판정, 음성·직접 입력, 들린 말 인정·실패 처리, 단어 기록과 승리 팀 자동 점수를 제공해요.",
    category: "education",
    status: "available",
    access: "free",
    runtime: "bundled-html",
  },
  {
    id: "memory",
    name: "메모리 배틀",
    summary: "우리 사진으로 만드는 기억력 대결",
    description:
      "사진을 골라 4~48장의 카드로 짝 맞추기를 해요. 2~4팀 대결, 기억·공개 시간, 번호 음성 선택, 다시 섞기와 점수 보정으로 수업을 진행해요.",
    category: "game",
    status: "available",
    access: "free",
    runtime: "bundled-html",
  },
  {
    id: "timer",
    name: "수업 타이머",
    summary: "활동과 휴식, 반복 수업을 한눈에",
    description:
      "수업 시간과 준비·휴식·반복 횟수를 설정하고 큰 숫자로 진행해요. 일시정지와 이어하기, 마지막 카운트 안내음을 제공해요. 설정은 이 기기에 저장하며, 앱을 벗어나면 자동으로 일시정지해요.",
    category: "classroom",
    status: "available",
    access: "free",
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
