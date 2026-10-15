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
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { Button, Copy, c } from "../ui";
import {
  advanceTimer,
  formatTimer,
  initialTimer,
  planError,
  timerFrame,
  totalDuration,
  type TimerEvent,
  type TimerStep,
} from "../../tools/timer-engine";

type Props = {
  title: string;
  plan: TimerStep[];
  sound: boolean;
  onExit: () => void;
};
export default function TimerSession({ title, plan, sound, onExit }: Props) {
  const total = totalDuration(plan);
  const invalid = planError(plan);
  const [state, setState] = useState(initialTimer);
  const current = useRef(state);
  const alive = useRef(true);
  const focusedRef = useRef(false);
  const [focused, setFocused] = useState(false);
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<"exit" | "reset" | null>(null);
  const allowExit = useRef(false);
  const navigation = useNavigation();
  const pendingAction = useRef<
    Parameters<typeof navigation.dispatch>[0] | null
  >(null);
  const player = useAudioPlayer(require("../../../assets/countdown.wav"));
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const stopSound = useCallback(() => {
    try {
      player.pause();
    } catch {
      /* Player may already be released during route cleanup. */
    }
  }, [player]);
  const send = useCallback(
    (event: TimerEvent) => {
      if (!alive.current) return;
      const next = advanceTimer(
        current.current,
        event,
        performance.now(),
        total,
      );
      current.current = next;
      setState(next);
    },
    [total],
  );
  const askExit = useCallback(() => {
    stopSound();
    if (
      current.current.status === "running" ||
      current.current.status === "paused"
    ) {
      send("pause");
      setDialog("exit");
    } else {
      allowExit.current = true;
      onExit();
    }
  }, [send, stopSound, onExit]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useFocusEffect(
    useCallback(() => {
      let disposed = false;
      let awakeTag: string | null = null;
      let serial = 0;
      const prefix = `seolin-timer-${Math.random().toString(36).slice(2)}`;
      function releaseAwake() {
        const previous = awakeTag;
        awakeTag = null;
        if (previous) void deactivateKeepAwake(previous).catch(() => {});
      }
      function activate() {
        if (disposed) return;
        focusedRef.current = true;
        setFocused(true);
        releaseAwake();
        const tag = `${prefix}-${++serial}`;
        awakeTag = tag;
        void activateKeepAwakeAsync(tag)
          .then(() => {
            if (disposed || awakeTag !== tag)
              void deactivateKeepAwake(tag).catch(() => {});
          })
          .catch(() => {
            if (!disposed && alive.current)
              setNotice(
                "화면 자동 꺼짐 방지를 켜지 못했어요. 기기 화면 설정을 확인해 주세요.",
              );
          });
      }
      function suspend() {
        focusedRef.current = false;
        if (alive.current) {
          setFocused(false);
          send("pause");
        }
        stopSound();
        releaseAwake();
      }
      if (AppState.currentState === "active" || AppState.currentState === null)
        activate();
      void setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      }).catch(() => {
        if (!disposed && alive.current)
          setNotice("효과음을 준비하지 못했어요. 소리 없이 진행할 수 있어요.");
      });
      const app = AppState.addEventListener("change", (status) =>
        status === "active" ? activate() : suspend(),
      );
      const blur =
        Platform.OS === "android"
          ? AppState.addEventListener("blur", suspend)
          : undefined;
      const focus =
        Platform.OS === "android"
          ? AppState.addEventListener("focus", () => {
              if (AppState.currentState === "active") activate();
            })
          : undefined;
      const back =
        Platform.OS === "android"
          ? BackHandler.addEventListener("hardwareBackPress", () => {
              askExit();
              return true;
            })
          : undefined;
      return () => {
        disposed = true;
        suspend();
        app.remove();
        blur?.remove();
        focus?.remove();
        back?.remove();
      };
    }, [askExit, send, stopSound]),
  );
  usePreventRemove(
    state.status === "running" || state.status === "paused",
    ({ data }) => {
      if (allowExit.current) {
        navigation.dispatch(data.action);
        return;
      }
      pendingAction.current = data.action;
      send("pause");
      stopSound();
      setDialog("exit");
    },
  );
  useEffect(() => {
    if (!focused || state.status !== "running") return;
    const interval = setInterval(() => send("tick"), 100);
    return () => clearInterval(interval);
  }, [focused, state.status, send]);
  const frame = timerFrame(plan, state.elapsedMs);
  const remaining = Math.ceil(frame.remainingMs / 1000);
  const lastCue = useRef("");
  useEffect(() => {
    let cancelled = false;
    if (state.status === "ready") lastCue.current = "";
    const phase = frame.step;
    const cue =
      state.status === "completed"
        ? "done"
        : state.status === "running" &&
            phase &&
            (remaining <= 3 || remaining === phase.seconds)
          ? `${frame.index}-${remaining}`
          : "";
    if (sound && focused && cue && cue !== lastCue.current) {
      lastCue.current = cue;
      void player
        .seekTo(0)
        .then(() => {
          if (
            !cancelled &&
            alive.current &&
            focusedRef.current &&
            current.current.status !== "paused"
          )
            player.play();
        })
        .catch(() => {
          if (!cancelled && alive.current)
            setNotice("효과음을 재생하지 못했어요. 기기 음량을 확인해 주세요.");
        });
    }
    return () => {
      cancelled = true;
    };
  }, [
    sound,
    focused,
    state.status,
    frame.index,
    frame.step,
    remaining,
    player,
  ]);
  const done = state.status === "completed";
  const phaseColor =
    frame.step?.kind === "rest"
      ? "#83E1BF"
      : frame.step?.kind === "prepare"
        ? "#FFDA80"
        : "#B4C0FF";
  const progress = total ? state.elapsedMs / total : 0;
  const finish = () => {
    stopSound();
    allowExit.current = true;
    setDialog(null);
    if (pendingAction.current) {
      const action = pendingAction.current;
      pendingAction.current = null;
      navigation.dispatch(action);
    } else onExit();
  };
  if (invalid)
    return (
      <SafeAreaView style={styles.page}>
        <View style={{ padding: 24, gap: 20 }}>
          <Text style={styles.title}>{invalid}</Text>
          <Control label="설정으로 돌아가기" onPress={onExit} />
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { padding: landscape ? 14 : 22 },
        ]}
      >
        <View style={styles.top}>
          <Control label="← 설정" onPress={askExit} />
          <Text style={styles.brand}>서린툴 · {title}</Text>
          <Text style={styles.small}>{sound ? "효과음 켜짐" : "무음"}</Text>
        </View>
        {!!notice && (
          <Text accessibilityRole="alert" style={styles.small}>
            {notice}
          </Text>
        )}
        <View
          style={[
            styles.stage,
            { minHeight: landscape ? Math.min(260, height * 0.55) : 350 },
          ]}
        >
          <View style={styles.top}>
            <View
              style={[
                styles.phase,
                { borderColor: done ? "#83E1BF" : phaseColor },
              ]}
            >
              <Text
                accessibilityLiveRegion="polite"
                style={[
                  styles.phaseText,
                  { color: done ? "#83E1BF" : phaseColor },
                ]}
              >
                {done
                  ? "완료"
                  : state.status === "ready"
                    ? "시작 준비"
                    : state.status === "paused"
                      ? "일시정지"
                      : frame.step?.label}
              </Text>
            </View>
            <Text style={styles.round}>
              {frame.step?.round} / {frame.step?.totalRounds} 회
            </Text>
          </View>
          <View style={styles.clock}>
            <Text style={styles.caption}>
              {done
                ? "모두 수고했어요!"
                : state.status === "paused"
                  ? `${frame.step?.label} · 준비되면 이어서 진행해 주세요`
                  : frame.step?.label === "준비"
                    ? "자세를 준비해 주세요"
                    : frame.step?.kind === "rest"
                      ? "호흡을 고르세요"
                      : "지금 이 시간에 집중해요"}
            </Text>
            <Text
              allowFontScaling={false}
              accessibilityLabel={`남은 시간 ${formatTimer(remaining)}`}
              style={[
                styles.digits,
                {
                  fontSize: Math.max(
                    66,
                    Math.min(landscape ? height * 0.28 : width * 0.245, 180),
                  ),
                  color: done ? "#83E1BF" : "white",
                },
              ]}
            >
              {formatTimer(done ? 0 : remaining)}
            </Text>
            {done ? (
              <Text style={styles.caption}>
                설정한 {formatTimer(total / 1000)}을 마쳤어요
              </Text>
            ) : (
              <Text style={styles.caption}>
                다음 · {plan[frame.index + 1]?.label ?? "완료"}
                {plan[frame.index + 1]
                  ? ` ${formatTimer(plan[frame.index + 1]!.seconds)}`
                  : ""}
              </Text>
            )}
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="전체 진행률"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.floor(progress * 100),
            }}
            style={styles.track}
          >
            <View
              style={[
                styles.progress,
                { width: `${progress * 100}%`, backgroundColor: phaseColor },
              ]}
            />
          </View>
          <View style={styles.top}>
            <Text style={styles.small}>
              전체 남은 시간 {formatTimer((total - state.elapsedMs) / 1000)}
            </Text>
            <Text style={styles.small}>총 {formatTimer(total / 1000)}</Text>
          </View>
        </View>
        <View style={styles.controls}>
          {state.status === "ready" ? (
            <Control
              primary
              label="▶ 시작하기"
              disabled={!focused}
              onPress={() => send("start")}
            />
          ) : state.status === "running" ? (
            <Control
              primary
              label="Ⅱ 일시정지"
              onPress={() => {
                send("pause");
                stopSound();
              }}
            />
          ) : state.status === "paused" ? (
            <Control
              primary
              label="▶ 이어서 진행"
              disabled={!focused || dialog !== null}
              onPress={() => send("resume")}
            />
          ) : (
            <Control
              primary
              label="다시 준비하기"
              onPress={() => {
                stopSound();
                send("reset");
              }}
            />
          )}
          {!done && state.status !== "ready" && (
            <Control
              label="처음부터"
              onPress={() => {
                send("pause");
                stopSound();
                setDialog("reset");
              }}
            />
          )}
          <Control label={done ? "설정으로" : "마치기"} onPress={askExit} />
        </View>
        <Text style={styles.help}>
          {done
            ? "오늘도 함께한 시간, 잘 해냈어요."
            : "앱을 벗어나면 일시정지돼요. 돌아온 뒤 직접 이어서 진행해 주세요."}
        </Text>
        <Text style={styles.watermark}>서린태권도</Text>
      </ScrollView>
      <Modal
        transparent
        animationType="fade"
        visible={dialog !== null}
        onRequestClose={() => {
          pendingAction.current = null;
          setDialog(null);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={{ fontSize: 23, fontWeight: "800", color: c.text }}>
              {dialog === "reset"
                ? "처음부터 다시 준비할까요?"
                : "타이머를 마칠까요?"}
            </Text>
            <Copy>
              {dialog === "reset"
                ? "진행 시간이 초기화돼요. 시작 버튼을 눌러 다시 진행할 수 있어요."
                : "설정은 유지되고 진행 시간은 초기화돼요."}
            </Copy>
            <Button
              label={dialog === "reset" ? "처음으로 초기화" : "타이머 마치기"}
              onPress={() => {
                if (dialog === "reset") {
                  send("reset");
                  setDialog(null);
                } else finish();
              }}
            />
            <Button
              secondary
              label="돌아가기 · 일시정지 유지"
              onPress={() => {
                pendingAction.current = null;
                setDialog(null);
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
function Control({
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        primary && styles.primary,
        { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text
        style={{
          color: primary ? "#172148" : "white",
          fontSize: primary ? 19 : 15,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#101B3B" },
  content: {
    flexGrow: 1,
    gap: 16,
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  brand: { fontSize: 16, fontWeight: "800", color: "#EEF1FF" },
  small: { color: "#C0CAE6", fontSize: 13, lineHeight: 20 },
  title: { fontSize: 24, color: "white", fontWeight: "800" },
  stage: {
    flex: 1,
    backgroundColor: "#18264D",
    borderColor: "#35466F",
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    gap: 16,
  },
  phase: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: "#101B3B",
  },
  phaseText: { fontSize: 17, fontWeight: "800" },
  round: { fontSize: 18, color: "#E8ECFF", fontWeight: "800" },
  clock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  digits: {
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -3,
  },
  caption: {
    fontSize: 16,
    color: "#CAD4F4",
    textAlign: "center",
    lineHeight: 24,
  },
  track: {
    height: 8,
    backgroundColor: "#334264",
    borderRadius: 8,
    overflow: "hidden",
  },
  progress: { height: "100%", borderRadius: 8 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  control: {
    minHeight: 50,
    backgroundColor: "#26365E",
    borderColor: "#52638E",
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#D9DFFF",
    borderColor: "#E8ECFF",
    minWidth: 180,
  },
  help: { textAlign: "center", color: "#B8C5E6", fontSize: 13, lineHeight: 20 },
  watermark: {
    color: "#94A2C9",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    gap: 18,
  },
});
