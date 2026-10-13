import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Orientation from "expo-screen-orientation";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { initialGame, transition, type Event, type Lesson } from "@seolin/ox";
import { Back, Button, Copy, Page, c } from "../../src/components/ui";
import { useLesson } from "../../src/state/lesson";
export default function Play() {
  const { lesson, ready, error } = useLesson();
  return ready ? (
    <Session lesson={lesson} />
  ) : (
    <Page>
      <Back title="O/X 게임" />
      <Copy>{error || "수업을 준비하고 있어요."}</Copy>
    </Page>
  );
}
function Session({ lesson }: { lesson: Lesson }) {
  const [game, setGame] = useState(() => initialGame(lesson));
  const [focused, setFocused] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const player = useAudioPlayer(require("../../assets/countdown.wav"));
  const send = useCallback(
    (type: Event["type"]) =>
      setGame((current) =>
        transition(current, { type, now: performance.now() }, lesson),
      ),
    [lesson],
  );
  const requestExit = useCallback(() => {
    send("pause");
    setExitOpen(true);
  }, [send]);
  useFocusEffect(
    useCallback(() => {
      let disposed = false;
      setFocused(true);
      const orientation =
        Platform.OS === "web"
          ? Promise.resolve()
          : Orientation.lockAsync(Orientation.OrientationLock.LANDSCAPE).catch(
              () => {
                if (!disposed)
                  setNotice(
                    "가로 고정을 지원하지 않는 기기예요. 기기를 가로로 돌려 주세요.",
                  );
              },
            );
      void activateKeepAwakeAsync("ox-class").catch(() => {});
      void setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      }).catch(() => {
        if (!disposed)
          setNotice("효과음을 준비하지 못했어요. 소리 없이 진행할 수 있어요.");
      });
      const subscription = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          send("pause");
          player.pause();
        }
      });
      const back = BackHandler.addEventListener("hardwareBackPress", () => {
        requestExit();
        return true;
      });
      return () => {
        disposed = true;
        setFocused(false);
        send("pause");
        player.pause();
        subscription.remove();
        back.remove();
        void deactivateKeepAwake("ox-class").catch(() => {});
        void orientation
          .then(() =>
            Platform.OS !== "web" ? Orientation.unlockAsync() : undefined,
          )
          .catch(() => {});
      };
    }, [send, player, requestExit]),
  );
  useEffect(() => {
    if (!focused || game.paused || game.deadline === null) return;
    const timer = setInterval(() => send("tick"), 100);
    return () => clearInterval(timer);
  }, [focused, game.paused, game.deadline, send]);
  const seconds = Math.ceil(game.remaining / 1000);
  const previousBeep = useRef("");
  useEffect(() => {
    let cancelled = false;
    const cue = `${game.index}-${game.phase}-${seconds}`;
    if (
      focused &&
      !game.paused &&
      lesson.sound &&
      game.phase === "counting" &&
      seconds > 0 &&
      seconds <= 3 &&
      cue !== previousBeep.current
    ) {
      previousBeep.current = cue;
      void player
        .seekTo(0)
        .then(() => {
          if (!cancelled) player.play();
        })
        .catch(() =>
          setNotice("효과음을 재생하지 못했어요. 기기 음량을 확인해 주세요."),
        );
    }
    return () => {
      cancelled = true;
    };
  }, [
    focused,
    game.paused,
    game.index,
    game.phase,
    seconds,
    lesson.sound,
    player,
  ]);
  const question = lesson.questions[game.index]!;
  const finished = game.phase === "done";
  const revealed = game.phase === "revealed";
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: landscape ? 16 : 22,
          gap: 14,
        }}
      >
        <View style={styles.top}>
          <Text style={styles.brand}>SEOLIN KIT / 서린태권도</Text>
          <Button secondary label="나가기" onPress={requestExit} />
        </View>
        {notice !== "" && <Text style={styles.note}>{notice}</Text>}
        {finished ? (
          <View style={styles.center}>
            <Text style={styles.eyebrow}>오늘의 O/X 수업 완료</Text>
            <Text style={styles.question}>모두 수고했어요!</Text>
            <Text style={styles.note}>
              {lesson.questions.length}문제를 함께 풀었어요.
            </Text>
            <View style={styles.controls}>
              <Button
                secondary
                label="다시 진행"
                onPress={() => send("restart")}
              />
              <Button
                label="수업 준비로"
                onPress={() => router.replace("/ox")}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.top}>
              <Text style={styles.eyebrow}>
                QUESTION {game.index + 1} / {lesson.questions.length}
              </Text>
              <Text style={styles.note}>
                {game.paused
                  ? "일시정지"
                  : game.phase === "ready"
                    ? "문제를 읽고 시작해 주세요"
                    : game.phase === "waiting"
                      ? "시간 종료 · 정답 공개를 눌러 주세요"
                      : revealed
                        ? lesson.automatic
                          ? `${seconds}초 후 다음 문제`
                          : "정답 공개"
                        : `남은 시간 ${seconds}초`}
              </Text>
            </View>
            <Text
              style={[
                styles.question,
                { fontSize: landscape ? Math.min(40, width / 22) : 29 },
              ]}
            >
              {question.text}
            </Text>
            <View
              style={[styles.answers, { minHeight: landscape ? 110 : 200 }]}
            >
              {(revealed ? [question.answer] : ["O", "X"]).map((answer) => (
                <View
                  key={answer}
                  style={[
                    styles.answer,
                    { backgroundColor: answer === "O" ? "#233674" : "#432B48" },
                  ]}
                >
                  {revealed && <Text style={styles.eyebrow}>정답은</Text>}
                  <Text
                    accessibilityLabel={revealed ? `정답 ${answer}` : answer}
                    style={{
                      fontSize: landscape ? 92 : 110,
                      lineHeight: landscape ? 105 : 125,
                      fontWeight: "900",
                      color: answer === "O" ? "#FFFFFF" : c.coral,
                    }}
                  >
                    {answer}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.controls}>
              {game.paused ? (
                <Button
                  secondary
                  label="이어서 진행"
                  onPress={() => send("resume")}
                />
              ) : (
                <>
                  {game.phase === "ready" && (
                    <Button
                      secondary
                      label="카운트 시작"
                      onPress={() => send("start")}
                    />
                  )}
                  <Button
                    secondary
                    label="일시정지"
                    onPress={() => {
                      send("pause");
                      player.pause();
                    }}
                  />
                  {(game.phase === "waiting" || game.phase === "counting") && (
                    <Button label="정답 공개" onPress={() => send("reveal")} />
                  )}{" "}
                  {revealed && (
                    <Button
                      label={
                        game.index + 1 === lesson.questions.length
                          ? "수업 마치기"
                          : "다음 문제"
                      }
                      onPress={() => send("next")}
                    />
                  )}
                  <Button
                    secondary
                    label="이전 문제"
                    disabled={game.index === 0}
                    onPress={() => send("previous")}
                  />
                </>
              )}
            </View>
            {!landscape && (
              <Text style={styles.note}>
                기기를 가로로 돌리면 문제를 더 넓게 볼 수 있어요.
              </Text>
            )}
          </>
        )}
      </ScrollView>
      <Modal
        transparent
        visible={exitOpen}
        animationType="fade"
        onRequestClose={() => setExitOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: c.text }}>
              수업을 종료할까요?
            </Text>
            <Copy>
              저장한 문제는 유지돼요. 진행 중인 순서와 시간은 초기화돼요.
            </Copy>
            <Button
              label="수업 종료"
              onPress={() => {
                setExitOpen(false);
                router.replace("/ox");
              }}
            />
            <Button
              secondary
              label="돌아가기 · 일시정지 유지"
              onPress={() => setExitOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.stage },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  brand: {
    fontSize: 13,
    fontWeight: "800",
    color: "#B7C2EF",
    letterSpacing: 1,
  },
  eyebrow: { fontSize: 14, fontWeight: "800", color: "#C7D1FF" },
  note: { fontSize: 14, color: "#CCD4EF", lineHeight: 21 },
  question: {
    fontSize: 34,
    color: "white",
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: 8,
  },
  answers: { flexDirection: "row", gap: 20, flex: 1 },
  answer: {
    flex: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  overlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 24,
    gap: 18,
    width: "100%",
    maxWidth: 440,
  },
});
