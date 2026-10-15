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
  {
    id: "teams",
    name: "팀 나누기 & 랜덤 뽑기",
    summary: "함께할 팀과 오늘의 주인공을 공평하게",
    description:
      "명단을 입력하면 인원을 고르게 나누고 원하는 수만큼 무작위로 뽑아요. 동명이인 구분, 이전 당첨자 제외, 추첨 기록 초기화를 제공해요. 명단은 저장 버튼을 누를 때만 이 기기에 보관해요.",
    category: "classroom",
    status: "available",
    access: "free",
    runtime: "native",
  },
  {
    id: "tabata",
    name: "타바타 타이머",
    summary: "운동과 휴식을 반복하며 함께 움직여요",
    description:
      "준비·운동·휴식 시간과 세트 수를 직접 설정하고 큰 숫자로 진행해요. 20초 운동·10초 휴식 프리셋, 소리 안내, 일시정지와 이어하기를 제공해요. 마지막 운동이 끝나면 휴식 없이 완료하며 앱을 벗어나면 자동으로 일시정지해요.",
    category: "classroom",
    status: "available",
    access: "free",
    runtime: "native",
  },
  {
    id: "lucky-draw",
    name: "태권뽑기",
    summary: "아홉 가지 태권도 이야기로 만나는 오늘의 행운",
    description:
      "도복 캡슐, 돌려차기 룰렛, 미트, 사물함, 두루마리, 도복 주머니, 메달, 호랑이 복주머니, 회전 송판으로 상품을 뽑아요. 상품·다음 기회 수량과 결과를 이 기기에 저장하며 남은 수량만큼 공평하게 추첨해요.",
    category: "classroom",
    status: "available",
    access: "free",
    runtime: "native",
  },
  {
    id: "taekwondo-pinball",
    name: "띠 핀볼",
    summary: "미트를 통통, 송판을 격파하고 행운의 칸까지",
    description:
      "태권도 도장 속 3D 핀볼 보드에 금색 공을 떨어뜨려요. 미트·송판·띠 경사로를 지나 도착한 칸으로 당첨과 꽝을 확인해요. 선물 이름과 당첨 칸을 설정하고 최근 50번의 결과를 이 기기에 저장해요.",
    category: "game",
    status: "available",
    access: "free",
    runtime: "bundled-html",
  },
  {
    id: "taekwondo-breaking",
    name: "격파 한 판",
    summary: "송판을 골라 힘차게! 발차기로 만나는 오늘의 행운",
    description:
      "세 장의 송판 중 하나를 골라 태권도 캐릭터와 함께 격파해요. 당첨이면 금빛 메달과 박수로 축하해요. 선물과 당첨 송판 수를 설정하고 최근 50번의 격파 기록을 이 기기에 저장해요.",
    category: "game",
    status: "available",
    access: "free",
    runtime: "bundled-html",
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
