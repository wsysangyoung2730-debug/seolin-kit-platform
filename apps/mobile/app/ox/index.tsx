import { useEffect, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { copyLesson, defaultLesson, lessonError } from "@seolin/ox";
import {
  AppIcon,
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
export default function OxSetup() {
  const { lesson, ready, error, save, reload } = useLesson();
  const [seconds, setSeconds] = useState(String(lesson.seconds));
  const [automatic, setAutomatic] = useState(lesson.automatic);
  const [sound, setSound] = useState(lesson.sound);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setSeconds(String(lesson.seconds));
    setAutomatic(lesson.automatic);
    setSound(lesson.sound);
  }, [lesson]);
  async function start() {
    const next = { ...lesson, seconds: Number(seconds), automatic, sound };
    const problem = lessonError(next);
    if (problem) {
      setNotice(problem);
      return;
    }
    setBusy(true);
    if (await save(next)) router.push("/ox/play");
    setBusy(false);
  }
  return (
    <Page
      footer={
        <Button
          label={busy ? "준비하는 중…" : "수업 화면 열기"}
          disabled={!ready || busy}
          onPress={() => void start()}
        />
      }
    >
      <Back title="O/X 게임" />
      <View style={s.row}>
        <AppIcon id="ox" />
        <View style={{ flex: 1 }}>
          <Title>수업 준비</Title>
          <Text style={s.small}>아이들과 함께 정답을 찾아요</Text>
        </View>
      </View>
      {!!error && (
        <Card>
          <Copy>{error}</Copy>
          <Button label="다시 불러오기" onPress={reload} />
          {!ready && (
            <Button
              secondary
              label="기본 문제로 새로 저장"
              onPress={() => void save(copyLesson(defaultLesson))}
            />
          )}
        </Card>
      )}
      {!ready && !error && <Copy>저장된 수업을 불러오고 있어요.</Copy>}
      <Card>
        <Text style={s.badge}>문제 세트 · {lesson.questions.length}문제</Text>
        <Text style={s.heading}>{lesson.title}</Text>
        <Copy>{lesson.questions[0]?.text}</Copy>
        <Button
          secondary
          label="문제 편집하기"
          disabled={!ready || busy}
          onPress={() => router.push("/ox/editor")}
        />
      </Card>
      <Card>
        <Text style={s.heading}>문제당 제한 시간</Text>
        <View style={s.row}>
          <TextInput
            accessibilityLabel="제한 시간 (초)"
            value={seconds}
            onChangeText={setSeconds}
            keyboardType="number-pad"
            maxLength={2}
            style={[s.input, { width: 90 }]}
            editable={!busy}
          />
          <Copy>초 · 1~60초</Copy>
        </View>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.heading}>자동 진행</Text>
            <Text style={s.small}>
              시간 종료 시 정답 공개, 3초 후 다음 문제
            </Text>
          </View>
          <Switch
            accessibilityLabel="자동 진행"
            value={automatic}
            onValueChange={setAutomatic}
            disabled={busy}
            trackColor={{ true: c.accent }}
          />
        </View>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <Text style={s.heading}>효과음</Text>
          <Switch
            accessibilityLabel="효과음"
            value={sound}
            onValueChange={setSound}
            disabled={busy}
            trackColor={{ true: c.accent }}
          />
        </View>
      </Card>
      {!!notice && (
        <Text accessibilityRole="alert" style={{ color: c.coral }}>
          {notice}
        </Text>
      )}
      <Card>
        <Text style={s.heading}>TV에 연결하기 전에</Text>
        <Copy>
          기기의 화면 미러링으로 TV에 연결해 주세요. 수업 화면은 가로로 넓게
          표시돼요. 미러링 중에는 휴대폰의 조작 버튼도 TV에 함께 보여요.
        </Copy>
        <Text style={s.small}>
          수동 진행에서는 선생님이 정답 공개와 다음 문제를 눌러요. 앱을 벗어나면
          자동으로 멈춰요.
        </Text>
      </Card>
    </Page>
  );
}
