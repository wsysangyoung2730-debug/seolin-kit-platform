import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  Modal,
  Platform,
  Pressable,
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
import CameraBackdrop from "../../src/components/ox/CameraBackdrop";
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
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("");
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [mirrored, setMirrored] = useState(false);
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
      void activateKeepAwakeAsync("ox-class")
        .then(() => {
          if (disposed) return deactivateKeepAwake("ox-class");
        })
        .catch(() => {});
      void setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      }).catch(() => {
        if (!disposed)
          setNotice("효과음을 준비하지 못했어요. 소리 없이 진행할 수 있어요.");
      });
      const subscription = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          setCameraEnabled(false);
          send("pause");
          player.pause();
        }
      });
      const back =
        Platform.OS === "android"
          ? BackHandler.addEventListener("hardwareBackPress", () => {
              requestExit();
              return true;
            })
          : undefined;
      return () => {
        disposed = true;
        setFocused(false);
        send("pause");
        player.pause();
        subscription.remove();
        back?.remove();
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
    if (game.phase === "ready") previousBeep.current = "";
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
  const status = game.paused
    ? "일시정지 · 준비되면 이어서 진행해 주세요"
    : game.phase === "ready"
      ? "시작을 누르면 카운트다운이 시작돼요"
      : game.phase === "waiting"
        ? "선택 완료! 선생님이 정답을 공개해 주세요"
        : revealed
          ? lesson.automatic
            ? `${seconds}초 후 다음 문제`
            : `정답은 ${question.answer}입니다`
          : "정답이라고 생각하는 쪽으로 이동해 주세요";
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: landscape ? 10 : 14,
          gap: 10,
        }}
      >
        <View style={styles.top}>
          <StageButton label="← 뒤로" onPress={requestExit} />
          <Text style={styles.brand}>
            서린툴 <Text style={{ color: "#8D9AC9" }}> / OX LIVE</Text>
          </Text>
          <StageButton
            label={cameraEnabled ? "카메라 끄기" : "카메라 켜기"}
            onPress={() => {
              setCameraEnabled(!cameraEnabled);
              setCameraStatus("");
            }}
          />
        </View>
        {cameraEnabled && (
          <View style={styles.cameraTools}>
            <StageButton
              label={facing === "front" ? "전면 → 후면" : "후면 → 전면"}
              onPress={() => {
                const front = facing !== "front";
                setFacing(front ? "front" : "back");
                setMirrored(front);
              }}
            />
            <StageButton
              label={mirrored ? "좌우 반전 켜짐" : "좌우 반전 꺼짐"}
              onPress={() => setMirrored(!mirrored)}
            />
            <Text
              style={[styles.note, { flex: 1, minWidth: 170 }]}
              accessibilityLiveRegion="polite"
            >
              {cameraStatus}
            </Text>
          </View>
        )}
        {!!notice && <Text style={styles.note}>{notice}</Text>}
        <View style={[styles.stage, { minHeight: landscape ? 240 : 430 }]}>
          {cameraEnabled && focused && !finished && (
            <CameraBackdrop
              facing={facing}
              mirrored={mirrored}
              onStatus={setCameraStatus}
            />
          )}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: "#0A153955" }]}
          />
          {!finished && (
            <View pointerEvents="none" style={styles.zones}>
              {(["O", "X"] as const).map((answer) => (
                <View
                  key={answer}
                  style={[
                    styles.zone,
                    {
                      borderColor: answer === "O" ? "#5387FF" : "#FF747D",
                      backgroundColor:
                        revealed && question.answer === answer
                          ? answer === "O"
                            ? "#426EFF66"
                            : "#F26B6166"
                          : "transparent",
                      opacity:
                        revealed && question.answer !== answer ? 0.22 : 1,
                    },
                  ]}
                >
                  <Text
                    accessibilityLabel={
                      revealed && question.answer === answer
                        ? `정답 ${answer}`
                        : answer
                    }
                    style={{
                      fontSize: landscape
                        ? Math.min(height * 0.46, 230)
                        : Math.min(width * 0.35, 180),
                      fontWeight: "900",
                      color: answer === "O" ? "#86A5FF" : "#FF9A9E",
                      opacity: revealed ? 1 : 0.65,
                    }}
                  >
                    {answer}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {finished ? (
            <View style={styles.center}>
              <Text style={styles.eyebrow}>오늘의 O/X 수업 완료</Text>
              <Text style={styles.question}>모두 수고했어요!</Text>
              <Text style={styles.note}>
                {lesson.questions.length}문제를 함께 풀었어요.
              </Text>
              <View style={styles.controls}>
                <StageButton
                  label="다시 진행"
                  onPress={() => send("restart")}
                />
                <StageButton
                  primary
                  label="수업 준비로"
                  onPress={() => router.replace("/ox")}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.questionBox}>
                <Text style={styles.questionNumber}>
                  Q {game.index + 1}/{lesson.questions.length}
                </Text>
                <Text
                  style={[
                    styles.question,
                    {
                      flex: 1,
                      fontSize: landscape ? Math.min(32, width / 27) : 23,
                    },
                  ]}
                >
                  {question.text}
                </Text>
              </View>
              <View style={styles.center}>
                {game.paused ? (
                  <StageButton
                    primary
                    large
                    label="▶ 이어서 진행"
                    onPress={() => send("resume")}
                  />
                ) : game.phase === "ready" ? (
                  <StageButton
                    primary
                    large
                    label="▶ 시작하기"
                    onPress={() => send("start")}
                  />
                ) : game.phase === "counting" ? (
                  <View style={styles.counter}>
                    <Text accessibilityLiveRegion="polite" style={styles.count}>
                      {seconds}
                    </Text>
                  </View>
                ) : game.phase === "waiting" ? (
                  <StageButton
                    primary
                    large
                    label="정답 공개"
                    onPress={() => send("reveal")}
                  />
                ) : (
                  <View style={styles.result}>
                    <Text style={styles.resultText}>
                      정답 {question.answer}
                    </Text>
                  </View>
                )}
              </View>
              <Text accessibilityLiveRegion="polite" style={styles.status}>
                {status}
              </Text>
            </>
          )}
        </View>
        {!finished && (
          <View style={styles.controls}>
            <StageButton
              label="이전 문제"
              disabled={game.index === 0 || game.paused}
              onPress={() => send("previous")}
            />
            {!game.paused && game.phase !== "ready" && (
              <StageButton
                label="일시정지"
                onPress={() => {
                  send("pause");
                  player.pause();
                }}
              />
            )}
            {!game.paused && game.phase === "counting" && (
              <StageButton label="정답 공개" onPress={() => send("reveal")} />
            )}
            {!game.paused && revealed && (
              <StageButton
                primary
                label={
                  game.index + 1 === lesson.questions.length
                    ? "수업 마치기"
                    : "다음 문제 →"
                }
                onPress={() => send("next")}
              />
            )}
            <Text style={styles.watermark}>서린태권도</Text>
          </View>
        )}
        {!landscape && (
          <Text style={styles.note}>
            가로로 돌리면 TV에서 더 넓게 볼 수 있어요.
          </Text>
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
function StageButton({
  label,
  onPress,
  disabled = false,
  primary = false,
  large = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  large?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stageButton,
        primary && styles.primary,
        large && {
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: 40,
        },
        { opacity: disabled ? 0.35 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text
        style={{
          color: primary ? "#172148" : "#F4F6FF",
          fontSize: large ? 28 : 14,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.stage },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  brand: { fontSize: 16, fontWeight: "800", color: "white" },
  note: { fontSize: 12, color: "#CCD4EF", lineHeight: 18 },
  eyebrow: { fontSize: 14, fontWeight: "800", color: "#C7D1FF" },
  cameraTools: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  stage: {
    flex: 1,
    backgroundColor: "#0B1530",
    borderRadius: 24,
    overflow: "hidden",
    padding: 12,
  },
  zones: { position: "absolute", inset: 0, flexDirection: "row" },
  zone: {
    flex: 1,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  questionBox: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#101B3BE8",
    borderWidth: 1,
    borderColor: "#B8C4EE88",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  questionNumber: {
    color: "#172148",
    backgroundColor: "#FFDA67",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: "900",
  },
  question: {
    color: "white",
    fontWeight: "800",
    textAlign: "center",
    fontSize: 30,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  counter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#101B3BE8",
    borderWidth: 2,
    borderColor: "#FFDA67",
    alignItems: "center",
    justifyContent: "center",
  },
  count: { fontSize: 64, fontWeight: "900", color: "#FFDA67", lineHeight: 78 },
  result: {
    borderRadius: 30,
    backgroundColor: "#101B3BF0",
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  resultText: { color: "white", fontWeight: "900", fontSize: 30 },
  status: {
    alignSelf: "center",
    color: "#F4F6FF",
    backgroundColor: "#101B3BE8",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
    overflow: "hidden",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  stageButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#26365E",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#53628A",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primary: {
    backgroundColor: "#FFDA67",
    borderColor: "#FFF0BF",
    borderWidth: 2,
  },
  watermark: {
    color: "#9CA9CF",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 12,
  },
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
