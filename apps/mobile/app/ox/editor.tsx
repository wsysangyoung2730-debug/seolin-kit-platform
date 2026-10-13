import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import {
  copyLesson,
  parseQuestions,
  lessonError,
  type Answer,
} from "@seolin/ox";
import {
  Back,
  Button,
  Card,
  Copy,
  Page,
  Title,
  c,
  s,
} from "../../src/components/ui";
import { useLesson } from "../../src/state/lesson";
export default function Editor() {
  const { lesson, ready, error, save } = useLesson();
  if (!ready)
    return (
      <Page>
        <Back title="문제 편집" />
        <Copy>{error || "문제를 불러오는 중이에요."}</Copy>
      </Page>
    );
  return (
    <EditorForm
      key={lesson.title + lesson.questions.map((q) => q.id).join(",")}
    />
  );
}
function EditorForm() {
  const { lesson, error, save } = useLesson();
  const [draft, setDraft] = useState(() => copyLesson(lesson));
  const [bulk, setBulk] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState<{
    question: (typeof draft.questions)[number];
    index: number;
  } | null>(null);
  function patch(id: string, part: { text?: string; answer?: Answer }) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === id ? { ...q, ...part } : q)),
    }));
  }
  async function finish() {
    const problem = lessonError(draft);
    if (problem) {
      setNotice(problem);
      return;
    }
    setBusy(true);
    if (await save(draft)) router.back();
    setBusy(false);
  }
  function importText() {
    try {
      const questions = parseQuestions(bulk);
      if (draft.questions.length + questions.length > 100)
        throw new Error("기존 문제와 합쳐 100개까지 추가할 수 있어요.");
      const stamp = Date.now();
      setDraft((d) => ({
        ...d,
        questions: [
          ...d.questions,
          ...questions.map((q) => ({ ...q, id: `${stamp}-${q.id}` })),
        ],
      }));
      setBulk("");
      setNotice(`${questions.length}문제를 추가했어요.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "형식을 확인해 주세요.");
    }
  }
  return (
    <Page
      footer={
        <Button
          label={busy ? "저장 중…" : "저장하고 돌아가기"}
          disabled={busy}
          onPress={() => void finish()}
        />
      }
    >
      <Back title="문제 편집" />
      <Title>우리 수업에 맞게</Title>
      <Copy>
        현재 수업 한 세트를 기기에 저장해요. 저장 버튼을 눌러야 변경 내용이
        반영돼요.
      </Copy>
      <TextInput
        accessibilityLabel="수업 이름"
        value={draft.title}
        onChangeText={(title) => setDraft((d) => ({ ...d, title }))}
        maxLength={60}
        style={s.input}
        editable={!busy}
      />
      {draft.questions.map((q, i) => (
        <Card key={q.id}>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Text style={s.heading}>문제 {i + 1}</Text>
            <Button
              secondary
              label={`${i + 1}번 삭제`}
              disabled={busy}
              onPress={() => {
                setRemoved({ question: q, index: i });
                setDraft((d) => ({
                  ...d,
                  questions: d.questions.filter((x) => x.id !== q.id),
                }));
              }}
            />
          </View>
          <TextInput
            accessibilityLabel={`${i + 1}번 문제`}
            multiline
            value={q.text}
            onChangeText={(text) => patch(q.id, { text })}
            maxLength={200}
            style={[s.input, { minHeight: 84, textAlignVertical: "top" }]}
            editable={!busy}
          />
          <View style={s.row}>
            <Copy>정답</Copy>
            {(["O", "X"] as const).map((a) => (
              <Button
                key={a}
                label={`${a}${q.answer === a ? " ✓" : ""}`}
                secondary={q.answer !== a}
                disabled={busy}
                onPress={() => patch(q.id, { answer: a })}
              />
            ))}
          </View>
        </Card>
      ))}
      {removed && (
        <Button
          secondary
          label="방금 삭제한 문제 복원"
          disabled={busy || draft.questions.length >= 100}
          onPress={() => {
            setDraft((d) => {
              const questions = [...d.questions];
              questions.splice(removed.index, 0, removed.question);
              return { ...d, questions };
            });
            setRemoved(null);
          }}
        />
      )}
      <Button
        secondary
        label="+ 문제 추가"
        disabled={busy || draft.questions.length >= 100}
        onPress={() =>
          setDraft((d) => ({
            ...d,
            questions: [
              ...d.questions,
              {
                id: `q-${Date.now()}-${d.questions.length}`,
                text: "",
                answer: "O",
              },
            ],
          }))
        }
      />
      <Card>
        <Text style={s.heading}>문제 한 번에 붙여넣기</Text>
        <Copy>
          한 줄에 하나씩 입력하면 기존 문제 뒤에 추가돼요. 예: 태권도는 올림픽
          종목이다. | O
        </Copy>
        <TextInput
          accessibilityLabel="문제 붙여넣기"
          multiline
          value={bulk}
          onChangeText={setBulk}
          maxLength={25000}
          placeholder="문제 내용 | O 또는 X"
          style={[s.input, { minHeight: 120 }]}
          editable={!busy}
        />
        <Button
          secondary
          label="붙여넣은 문제 추가"
          disabled={busy || !bulk.trim()}
          onPress={importText}
        />
      </Card>
      {!!(notice || error) && (
        <Text accessibilityRole="alert" style={{ color: c.brand }}>
          {notice || error}
        </Text>
      )}
      <Copy>
        편집 화면의 뒤로가기를 누르면 저장하지 않은 수정은 반영되지 않아요.
      </Copy>
    </Page>
  );
}
