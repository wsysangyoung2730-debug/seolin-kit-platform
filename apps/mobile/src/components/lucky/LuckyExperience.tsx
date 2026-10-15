import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  BackHandler,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import {
  modes,
  type DrawResult,
  type LuckyModeId,
} from "../../tools/lucky-draw";
import LuckyScene from "./LuckyScene";
import { RoundGate } from "./round-gate";

type Props = {
  mode: LuckyModeId;
  onDraw: (selectedIndex?: number) => Promise<DrawResult | null>;
  onExit: () => void;
  onReveal?: (result: DrawResult) => void;
  disabled?: boolean;
};
type Phase =
  | "idle"
  | "pull"
  | "cracking"
  | "spinning"
  | "charge"
  | "resolving"
  | "opening"
  | "paused"
  | "reveal";
const choices: Partial<Record<LuckyModeId, { count: number; unit: string }>> = {
  mitts: { count: 4, unit: "미트" },
  lockers: { count: 6, unit: "사물함" },
  scrolls: { count: 3, unit: "두루마리" },
  uniforms: { count: 3, unit: "도복" },
};

export default function LuckyExperience({
  mode,
  onDraw,
  onExit,
  onReveal,
  disabled = false,
}: Props) {
  const metadata = modes.find((item) => item.id === mode)!;
  const [phase, setPhase] = useState<Phase>("idle");
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [notice, setNotice] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [charged, setCharged] = useState(false);
  const [visualOpen, setVisualOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const sceneWidth = Math.min(420, landscape ? (width - 68) / 2 : width - 44);
  const alive = useRef(false);
  const active = useRef(true);
  const interrupted = useRef(false);
  const busy = useRef(false);
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;
  const gate = useRef(new RoundGate<DrawResult>());
  const latest = useRef({
    onDraw,
    onExit,
    onReveal,
    disabled,
    reduceMotion,
    selected,
  });
  latest.current = {
    onDraw,
    onExit,
    onReveal,
    disabled,
    reduceMotion,
    selected,
  };
  const motion = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const charge = useRef(new Animated.Value(0)).current;
  const unseal = useRef(new Animated.Value(0)).current;
  const animations = useRef<Set<Animated.CompositeAnimation>>(new Set());
  const spinStarted = useRef(0);
  const dragAction = useRef<() => void>(() => {});

  function stopAnimations() {
    for (const animation of animations.current) animation.stop();
    animations.current.clear();
  }
  function setStep(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }
  function animate(
    value: Animated.Value,
    toValue: number,
    duration: number,
    easing = Easing.inOut(Easing.cubic),
  ): Promise<boolean> {
    if (latest.current.reduceMotion) {
      value.setValue(toValue);
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      const animation = Animated.timing(value, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
      });
      animations.current.add(animation);
      animation.start(({ finished }) => {
        animations.current.delete(animation);
        resolve(finished);
      });
    });
  }
  function resetVisuals() {
    stopAnimations();
    motion.setValue(0);
    rotation.setValue(0);
    lift.setValue(0);
    charge.setValue(0);
    unseal.setValue(0);
    setVisualOpen(false);
    setCharged(false);
    setSelected(null);
  }
  function interrupt() {
    interrupted.current = true;
    stopAnimations();
    if (!alive.current) return;
    if (gate.current.value && phaseRef.current !== "reveal") {
      busy.current = false;
      setStep("paused");
      setNotice("확정된 결과를 안전하게 보관했어요. 준비되면 확인해 주세요.");
    } else if (
      !gate.current.value &&
      phaseRef.current !== "resolving" &&
      phaseRef.current !== "reveal"
    ) {
      busy.current = false;
      if (phaseRef.current !== "idle")
        setNotice("연출을 멈췄어요. 준비되면 다시 시작해 주세요.");
      resetVisuals();
      setStep("idle");
    }
  }
  const interruptRef = useRef(interrupt);
  interruptRef.current = interrupt;

  useEffect(() => {
    alive.current = true;
    gate.current = new RoundGate<DrawResult>();
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) setReduceMotion(enabled);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      cancelled = true;
      alive.current = false;
      gate.current.dispose();
      stopAnimations();
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let disposed = false;
      let awakeTag: string | null = null;
      let serial = 0;
      const prefix = `seolin-lucky-${Math.random().toString(36).slice(2)}`;
      function releaseAwake() {
        const previous = awakeTag;
        awakeTag = null;
        if (previous) void deactivateKeepAwake(previous).catch(() => {});
      }
      function focus() {
        if (disposed) return;
        active.current = true;
        releaseAwake();
        const tag = `${prefix}-${++serial}`;
        awakeTag = tag;
        void activateKeepAwakeAsync(tag)
          .then(() => {
            if (disposed || awakeTag !== tag)
              void deactivateKeepAwake(tag).catch(() => {});
          })
          .catch(() => {});
      }
      function suspend() {
        active.current = false;
        interruptRef.current();
        releaseAwake();
      }
      if (AppState.currentState === "active" || AppState.currentState === null)
        focus();
      else active.current = false;
      const app = AppState.addEventListener("change", (status) =>
        status === "active" ? focus() : suspend(),
      );
      const blur =
        Platform.OS === "android"
          ? AppState.addEventListener("blur", suspend)
          : undefined;
      const refocus =
        Platform.OS === "android"
          ? AppState.addEventListener("focus", () => {
              if (AppState.currentState === "active") focus();
            })
          : undefined;
      const back =
        Platform.OS === "android"
          ? BackHandler.addEventListener("hardwareBackPress", () => {
              latest.current.onExit();
              return true;
            })
          : undefined;
      return () => {
        disposed = true;
        suspend();
        app.remove();
        blur?.remove();
        refocus?.remove();
        back?.remove();
      };
    }, []),
  );

  useEffect(() => {
    if (reduceMotion) interruptRef.current();
  }, [reduceMotion]);

  function reveal() {
    if (!alive.current || !active.current) return;
    const value = gate.current.reveal();
    if (!value) return;
    busy.current = false;
    stopAnimations();
    // Backgrounding can stop a flip edge-on or leave a paper half pulled out.
    // Manual reveal always restores the completed pose before showing the result.
    motion.setValue(1);
    unseal.setValue(1);
    lift.setValue(mode === "uniforms" ? -100 : 0);
    charge.setValue(0);
    if (mode === "roulette")
      rotation.setValue(((6 - (value.selectedIndex ?? 0)) % 6) / 6);
    if (mode === "rotating")
      rotation.setValue(((5 - (value.selectedIndex ?? 0)) % 5) / 5);
    setResult(value);
    setVisualOpen(true);
    setStep("reveal");
    setNotice("");
    latest.current.onReveal?.(value);
  }

  async function playReveal(index: number, waitForOpen: boolean) {
    let finished = true;
    if (mode === "roulette") {
      finished = await animate(
        rotation,
        4 - index / 6,
        1800,
        Easing.out(Easing.cubic),
      );
    } else if (mode === "capsule" || mode === "medals") {
      motion.setValue(0);
      finished = await animate(motion, 1, mode === "capsule" ? 850 : 1100);
    } else if (mode === "uniforms") {
      finished = await animate(lift, -100, 650);
    } else if (mode === "mitts" || mode === "lockers") {
      motion.setValue(0);
      finished = await animate(motion, 0.5, 320);
      if (finished && alive.current && active.current && !interrupted.current) {
        setVisualOpen(true);
        finished = await animate(motion, 1, 360);
      }
    } else {
      motion.setValue(0);
      if (mode === "scrolls") setVisualOpen(true);
      finished = await animate(motion, 1, mode === "scrolls" ? 1100 : 750);
    }
    if (!alive.current) return;
    busy.current = false;
    if (!finished || interrupted.current || !active.current) {
      setStep("paused");
      return;
    }
    if (waitForOpen) setStep("opening");
    else reveal();
  }

  async function openResult() {
    if (busy.current || !gate.current.value || !active.current) return;
    busy.current = true;
    interrupted.current = false;
    setStep("resolving");
    unseal.setValue(0);
    let finished = await animate(unseal, 0.5, 240);
    if (finished && alive.current && active.current && !interrupted.current) {
      setVisualOpen(true);
      finished = await animate(unseal, 1, 260);
    }
    if (!alive.current) return;
    busy.current = false;
    if (!finished || interrupted.current || !active.current) setStep("paused");
    else reveal();
  }

  async function commit(index = selected ?? 0, waitForOpen = false) {
    if (busy.current || latest.current.disabled || !active.current) return;
    busy.current = true;
    interrupted.current = false;
    stopAnimations();
    setSelected(index);
    setNotice("");
    setStep("resolving");
    const response = await gate.current.request(() =>
      latest.current.onDraw(index),
    );
    if (!alive.current) return;
    if (response.status === "ignored") {
      busy.current = false;
      return;
    }
    if (response.status !== "result") {
      busy.current = false;
      resetVisuals();
      setStep("idle");
      setNotice(
        response.status === "failed"
          ? "결과를 저장하지 못했어요. 저장 상태를 확인하고 다시 시도해 주세요."
          : "아직 결과가 확정되지 않았어요. 남은 수량과 안내를 확인한 뒤 다시 시도해 주세요.",
      );
      return;
    }
    setResult(response.value);
    if (interrupted.current || !active.current) {
      busy.current = false;
      setStep("paused");
      return;
    }
    await playReveal(index, waitForOpen);
  }

  function startSpin() {
    if (
      busy.current ||
      disabled ||
      !active.current ||
      phaseRef.current !== "idle"
    )
      return;
    setNotice("");
    interrupted.current = false;
    spinStarted.current = performance.now();
    rotation.setValue(0);
    setStep("spinning");
    if (!reduceMotion) {
      const loop = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: mode === "roulette" ? 1500 : 2100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animations.current.add(loop);
      loop.start();
    }
  }

  function stopSpin() {
    if (phaseRef.current !== "spinning") return;
    stopAnimations();
    const index =
      Math.floor((performance.now() - spinStarted.current) / 250) %
      (mode === "roulette" ? 6 : 5);
    setSelected(index);
    if (mode === "roulette") void commit(index);
    else {
      rotation.setValue(((5 - index) % 5) / 5);
      setStep("cracking");
      setNotice("멈춘 송판을 한 번 눌러 격파해요.");
    }
  }

  function choose(index: number) {
    if (busy.current || disabled || !active.current) return;
    setSelected(index);
    setNotice("");
    if (mode === "uniforms") setStep("pull");
    else void commit(index);
  }

  function hitBoard() {
    if (busy.current || disabled || phaseRef.current !== "cracking") return;
    void commit(selected ?? 0);
  }

  function beginCharge() {
    if (
      busy.current ||
      disabled ||
      phaseRef.current !== "idle" ||
      !active.current
    )
      return;
    interrupted.current = false;
    charge.setValue(0);
    setCharged(false);
    setStep("charge");
    void animate(charge, 1, 1600, Easing.linear).then((finished) => {
      if (finished && alive.current && phaseRef.current === "charge")
        setCharged(true);
    });
  }
  function releaseCharge() {
    if (phaseRef.current !== "charge" || !active.current) return;
    stopAnimations();
    void commit(0, true);
  }

  dragAction.current = () => {
    if (phaseRef.current === "pull") void commit(selected ?? 0);
  };
  const drag = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        phaseRef.current === "pull" &&
        gesture.dy < -8 &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (phaseRef.current === "pull")
          lift.setValue(Math.max(-110, Math.min(0, gesture.dy)));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -55 && phaseRef.current === "pull")
          dragAction.current();
        else lift.setValue(0);
      },
      onPanResponderTerminate: () => lift.setValue(0),
    }),
  ).current;

  function restart() {
    if (busy.current || !gate.current.restart()) return;
    resetVisuals();
    setResult(null);
    setNotice("");
    interrupted.current = false;
    setStep("idle");
  }
  const controlDisabled = disabled || phase === "resolving";
  const select = choices[mode];
  const showChoices = !!select && phase === "idle";
  const selectedLabel = selected === null ? "" : `${selected + 1}번`;
  const sceneStage =
    phase === "reveal" || visualOpen
      ? "reveal"
      : ["resolving", "spinning", "charge", "cracking", "opening"].includes(
            phase,
          )
        ? "active"
        : selected !== null
          ? "ready"
          : "idle";
  const sceneProgress =
    phase === "reveal" || phase === "opening"
      ? 1
      : charged
        ? 1
        : phase === "charge"
          ? 0.45
          : phase === "resolving"
            ? 0.65
            : 0;
  const spinStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };
  const shakeStyle = {
    transform: [
      {
        rotate: motion.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange: ["0deg", "-8deg", "8deg", "-8deg", "8deg", "0deg"],
        }),
      },
    ],
  };
  const rotatingStyle = {
    transform: [
      {
        rotate: Animated.add(
          rotation,
          motion.interpolate({
            inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
            outputRange: [0, -0.02, 0.02, -0.02, 0.02, 0],
          }),
        ).interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
      },
    ],
  };
  const flipStyle = {
    transform: [
      { perspective: 800 },
      {
        rotateY: motion.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ["0deg", "90deg", "0deg"],
        }),
      },
    ],
  };
  const scrollStyle = {
    transform: [
      {
        scaleY: motion.interpolate({
          inputRange: [0, 1],
          outputRange: [phase === "resolving" ? 0.3 : 1, 1],
        }),
      },
    ],
  };
  const tossStyle = {
    transform: [
      { perspective: 800 },
      {
        rotateY: unseal.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ["0deg", "90deg", "0deg"],
        }),
      },
      {
        translateY: motion.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [0, -36, 0],
        }),
      },
      {
        rotate: motion.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };
  const doorStyle = {
    opacity: motion.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.3, 1],
    }),
  };
  const tigerStyle = {
    transform: [
      {
        scale: motion.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [1, 1.08, 1],
        }),
      },
    ],
  };
  const sceneAnimation =
    mode === "roulette"
      ? spinStyle
      : mode === "rotating"
        ? rotatingStyle
        : mode === "mitts"
          ? flipStyle
          : mode === "lockers"
            ? doorStyle
            : mode === "medals"
              ? tossStyle
              : mode === "scrolls"
                ? scrollStyle
                : mode === "capsule"
                  ? shakeStyle
                  : mode === "tiger"
                    ? tigerStyle
                    : undefined;

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="모드 선택으로 돌아가기"
            onPress={onExit}
            style={styles.back}
          >
            <Text style={styles.backText}>← 모드 선택</Text>
          </Pressable>
          <Text style={styles.brand}>서린툴 · 태권도 행운 뽑기</Text>
        </View>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>{metadata.mood}</Text>
          <Text style={styles.title}>{metadata.label}</Text>
        </View>
        <View style={[styles.layout, landscape && styles.landscape]}>
          <View style={[styles.stage, landscape && { flex: 1 }]}>
            <Text style={styles.stageLabel}>
              {phase === "reveal"
                ? "오늘의 결과"
                : selected !== null
                  ? `${selectedLabel} 선택`
                  : "나만의 행운을 찾아요"}
            </Text>
            <View
              style={{
                width: sceneWidth,
                height: (sceneWidth * 260) / 300,
                alignItems: "center",
                justifyContent: "center",
              }}
              {...drag.panHandlers}
            >
              <Animated.View
                style={{
                  width: 300,
                  height: 260,
                  transform: [{ scale: sceneWidth / 300 }],
                }}
              >
                <Animated.View
                  style={[{ width: 300, height: 260 }, sceneAnimation]}
                >
                  <LuckyScene
                    mode={mode}
                    stage={sceneStage}
                    selected={selected}
                    progress={sceneProgress}
                    resultKind={
                      phase === "reveal" || visualOpen
                        ? result?.kind
                        : undefined
                    }
                  />
                </Animated.View>
                {mode === "uniforms" &&
                  selected !== null &&
                  phase !== "reveal" && (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.pullToken,
                        {
                          left: 65 + (selected ?? 0) * 85 - 36,
                          transform: [{ translateY: lift }],
                        },
                      ]}
                    >
                      <Text style={styles.pullTokenText}>비밀 쪽지</Text>
                    </Animated.View>
                  )}
                {mode === "roulette" && (
                  <View pointerEvents="none" style={styles.pointer}>
                    <Text style={{ color: "#FFE0A0", fontSize: 32 }}>▼</Text>
                  </View>
                )}
                {mode === "capsule" &&
                  result &&
                  !visualOpen &&
                  phase !== "reveal" && (
                    <>
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.kickFoot,
                          {
                            opacity: motion.interpolate({
                              inputRange: [0, 0.15, 0.45, 1],
                              outputRange: [1, 1, 0, 0],
                            }),
                            transform: [
                              {
                                translateX: motion.interpolate({
                                  inputRange: [0, 0.22, 1],
                                  outputRange: [0, -32, 0],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Text style={styles.kickText}>얍!</Text>
                      </Animated.View>
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.fallingCapsule,
                          {
                            opacity: motion.interpolate({
                              inputRange: [0, 0.2, 0.35, 1],
                              outputRange: [0, 0, 1, 1],
                            }),
                            transform: [
                              {
                                translateY: motion.interpolate({
                                  inputRange: [0, 0.25, 0.8, 1],
                                  outputRange: [-18, 0, 20, 20],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.capsuleTop,
                            {
                              transform: [
                                {
                                  translateY: unseal.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -18],
                                  }),
                                },
                              ],
                            },
                          ]}
                        />
                        <View style={styles.capsuleBottom} />
                      </Animated.View>
                    </>
                  )}
              </Animated.View>
            </View>
            {phase === "pull" && (
              <Text style={styles.stageHint}>
                위로 끌어올리거나 아래 버튼을 눌러요 ↑
              </Text>
            )}
            {mode === "tiger" && (phase === "charge" || phase === "idle") && (
              <View style={styles.chargeTrack}>
                <Animated.View
                  style={[
                    styles.chargeFill,
                    { transform: [{ scaleX: charge }] },
                  ]}
                />
              </View>
            )}
          </View>

          <View style={[styles.controls, landscape && { flex: 1 }]}>
            {phase === "reveal" && result ? (
              <View
                accessibilityLiveRegion="polite"
                style={[styles.result, result.kind === "miss" && styles.miss]}
              >
                <Text style={styles.resultKicker}>
                  {result.kind === "prize"
                    ? "축하해요!"
                    : "함께 도전해 줘서 고마워요"}
                </Text>
                <Text style={styles.prize}>{result.prizeName}</Text>
                <Text style={styles.resultCopy}>
                  {result.kind === "prize"
                    ? "지도진과 함께 선물을 확인해 주세요."
                    : "오늘도 멋진 기합, 다음 도전도 응원해요."}
                </Text>
                <Action
                  label={
                    disabled
                      ? "이번 회차의 뽑기를 모두 마쳤어요"
                      : "다음 참여자 준비"
                  }
                  onPress={restart}
                  disabled={disabled}
                />
                <Action
                  label="모드 선택 · 결과 기록 보기"
                  onPress={onExit}
                  secondary
                />
              </View>
            ) : (
              <>
                <Text
                  accessibilityLiveRegion="polite"
                  style={styles.instruction}
                >
                  {instruction(mode, phase, selectedLabel, charged)}
                </Text>
                {!!notice && (
                  <Text accessibilityRole="alert" style={styles.notice}>
                    {notice}
                  </Text>
                )}
                {showChoices && (
                  <View style={styles.choices}>
                    {Array.from({ length: select!.count }, (_, index) => (
                      <Pressable
                        key={index}
                        accessibilityRole="button"
                        accessibilityLabel={`${index + 1}번 ${select!.unit} 선택`}
                        accessibilityState={{ disabled: controlDisabled }}
                        disabled={controlDisabled}
                        onPress={() => choose(index)}
                        style={({ pressed }) => [
                          styles.choice,
                          pressed && { opacity: 0.7 },
                          controlDisabled && { opacity: 0.4 },
                        ]}
                      >
                        <Text style={styles.choiceNumber}>{index + 1}</Text>
                        <Text style={styles.choiceUnit}>{select!.unit}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {phase === "pull" && (
                  <Action
                    label={`${selectedLabel} 도복의 주머니 열기`}
                    disabled={controlDisabled}
                    onPress={() => void commit(selected ?? 0)}
                  />
                )}
                {mode === "rotating" && phase === "cracking" && (
                  <Action
                    label="얍! 멈춘 송판 격파"
                    disabled={controlDisabled}
                    onPress={hitBoard}
                  />
                )}
                {mode === "capsule" && phase === "idle" && (
                  <Action
                    label="발차기로 캡슐 꺼내기"
                    disabled={controlDisabled}
                    onPress={() => void commit(0, true)}
                  />
                )}
                {(mode === "roulette" || mode === "rotating") &&
                  phase === "idle" && (
                    <Action
                      label={
                        mode === "roulette" ? "룰렛 돌리기" : "송판 회전 시작"
                      }
                      disabled={controlDisabled}
                      onPress={startSpin}
                    />
                  )}
                {phase === "spinning" && (
                  <Action
                    label={
                      mode === "roulette" ? "여기서 멈추기" : "송판 회전 멈추기"
                    }
                    disabled={disabled}
                    onPress={stopSpin}
                  />
                )}
                {mode === "medals" && phase === "idle" && (
                  <Action
                    label="주머니에서 메달 꺼내기"
                    disabled={controlDisabled}
                    onPress={() => void commit(0, true)}
                  />
                )}
                {mode === "tiger" &&
                  (phase === "idle" || phase === "charge") && (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="길게 누르고 놓아 기합 보내기"
                        accessibilityState={{ disabled: controlDisabled }}
                        disabled={controlDisabled}
                        onPressIn={beginCharge}
                        onPressOut={releaseCharge}
                        style={({ pressed }) => [
                          styles.roar,
                          pressed && styles.roarPressed,
                          controlDisabled && { opacity: 0.4 },
                        ]}
                      >
                        <Text style={styles.roarText}>
                          {phase === "charge"
                            ? charged
                              ? "얍! 이제 손을 놓아요"
                              : "기합 모으는 중…"
                            : "길게 눌러 기합 모으기"}
                        </Text>
                      </Pressable>
                      {phase === "idle" && (
                        <Action
                          secondary
                          label="한 번 눌러 기합 보내기"
                          disabled={controlDisabled}
                          onPress={() => void commit(0, true)}
                        />
                      )}
                      <Text style={styles.footnote}>
                        버튼으로 기합을 보내요. 마이크를 사용하지 않아요.
                      </Text>
                    </>
                  )}
                {phase === "resolving" && (
                  <Text style={styles.processing}>
                    두근두근, 결과를 준비하고 있어요…
                  </Text>
                )}
                {phase === "opening" && (
                  <Action
                    label={
                      mode === "capsule"
                        ? "캡슐 열어 보기"
                        : mode === "medals"
                          ? "메달 뒤집어 보기"
                          : "호랑이의 선물 주머니 열기"
                    }
                    onPress={() => void openResult()}
                  />
                )}
                {phase === "paused" && (
                  <Action label="확정된 결과 확인하기" onPress={reveal} />
                )}
                {disabled && phase === "idle" && (
                  <Text style={styles.notice}>
                    남은 수량이 없거나 저장을 처리하는 중이에요. 모드 선택
                    화면의 안내를 확인해 주세요.
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
        <Text style={styles.footnote}>
          선택한 위치와 누르는 타이밍은 연출이에요. 상품은 남은 수량에 따라
          무작위로 정해져요.
        </Text>
        <Text style={styles.footer}>
          나가도 확정된 결과는 기록에 남아요. · 서린태권도
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function instruction(
  mode: LuckyModeId,
  phase: Phase,
  selected: string,
  charged: boolean,
) {
  if (phase === "paused") return "잠깐 멈춰도 결과는 그대로예요";
  if (phase === "resolving") return "어떤 행운이 기다릴까요?";
  if (phase === "opening")
    return mode === "capsule"
      ? "캡슐이 도착했어요. 직접 열어 볼까요?"
      : mode === "medals"
        ? "반짝이는 메달, 뒤에는 무엇이 있을까요?"
        : "호랑이가 선물을 가져왔어요!";
  if (phase === "spinning") return "마음이 가는 순간, 멈추기를 눌러요";
  if (phase === "pull") return `${selected} 도복 주머니에서 비밀 쪽지를 꺼내요`;
  if (phase === "cracking") return "멈춘 송판을 격파하면 결과가 나와요";
  if (phase === "charge")
    return charged
      ? "기합 준비 완료! 손을 놓아 보내요"
      : "기합을 모아요. 손을 놓으면 출발!";
  const labels: Record<LuckyModeId, string> = {
    capsule: "발차기 한 번에 캡슐이 톡!",
    roulette: "룰렛을 돌리고 직접 멈춰 봐요",
    mitts: "마음에 드는 미트를 골라 뒤집어요",
    lockers: "어느 사물함 문을 열어 볼까요?",
    scrolls: "비밀 두루마리를 골라 펼쳐요",
    uniforms: "행운이 담긴 도복을 골라요",
    medals: "주머니에서 반짝이는 메달을 꺼내요",
    tiger: "호랑이에게 힘찬 기합을 보내요",
    rotating: "돌아가는 송판을 멈추고 격파해요",
  };
  return labels[mode];
}

function Action({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary && styles.secondary,
        { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[styles.actionText, secondary && { color: "#E6EDFF" }]}>
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#101B3B" },
  content: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    padding: 20,
    gap: 22,
    paddingBottom: 32,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  back: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#24345A",
    borderRadius: 14,
  },
  backText: { color: "#E6EDFF", fontWeight: "700", fontSize: 15 },
  brand: { color: "#BBC8E8", fontSize: 13 },
  heading: { gap: 7 },
  eyebrow: { color: "#FFDA91", fontSize: 14, fontWeight: "700" },
  title: { color: "white", fontSize: 30, fontWeight: "800" },
  layout: { gap: 22 },
  landscape: { flexDirection: "row", alignItems: "center" },
  stage: {
    backgroundColor: "#19284E",
    borderWidth: 1,
    borderColor: "#34486D",
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: "center",
    overflow: "hidden",
    gap: 10,
  },
  stageLabel: { color: "#D2DCFA", fontSize: 15, fontWeight: "700" },
  stageHint: {
    color: "#FFDA91",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  controls: { gap: 16 },
  instruction: {
    color: "#F2F5FF",
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 31,
  },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  choice: {
    flexGrow: 1,
    flexBasis: 75,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2B3D6C",
    borderWidth: 1,
    borderColor: "#5B6EA1",
    borderRadius: 18,
    padding: 12,
    gap: 5,
  },
  choiceNumber: { color: "#FFDA91", fontSize: 25, fontWeight: "800" },
  choiceUnit: { color: "#DDE5FF", fontSize: 13, fontWeight: "700" },
  action: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 17,
    backgroundColor: "#FFDA91",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: "#2A3C68",
    borderWidth: 1,
    borderColor: "#6275AB",
  },
  actionText: {
    color: "#152044",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  notice: { color: "#FFDBA8", fontSize: 14, lineHeight: 23 },
  processing: {
    color: "#D5DFFC",
    padding: 20,
    textAlign: "center",
    fontSize: 17,
  },
  pullToken: {
    position: "absolute",
    left: 119,
    top: 132,
    width: 38,
    minHeight: 50,
    backgroundColor: "#FFE1A0",
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFF5D7",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  pullTokenText: {
    color: "#202D78",
    fontWeight: "800",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 15,
  },
  kickFoot: {
    position: "absolute",
    left: 240,
    top: 186,
    width: 54,
    height: 25,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#8395D5",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  kickText: { color: "#202D78", fontSize: 13, fontWeight: "800" },
  fallingCapsule: {
    position: "absolute",
    left: 132,
    top: 205,
    width: 36,
    height: 36,
  },
  capsuleTop: {
    height: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#F68F85",
    borderWidth: 2,
    borderColor: "white",
  },
  capsuleBottom: {
    height: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: "#F5F7FF",
    borderWidth: 2,
    borderColor: "#C5D0F5",
  },
  pointer: { position: "absolute", left: 134, top: 0 },
  chargeTrack: {
    width: "80%",
    height: 12,
    overflow: "hidden",
    backgroundColor: "#35486F",
    borderRadius: 8,
  },
  chargeFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFCB74",
    borderRadius: 8,
  },
  roar: {
    minHeight: 94,
    backgroundColor: "#E68A39",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFD48E",
  },
  roarPressed: { backgroundColor: "#F4AB50" },
  roarText: {
    color: "#152044",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  result: {
    backgroundColor: "#233D54",
    borderRadius: 24,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: "#7AD9B4",
  },
  miss: { backgroundColor: "#27375B", borderColor: "#91A1CF" },
  resultKicker: { color: "#B9F1D9", fontSize: 17, fontWeight: "700" },
  prize: { color: "white", fontSize: 32, fontWeight: "800", lineHeight: 42 },
  resultCopy: { color: "#D8E5F4", fontSize: 15, lineHeight: 24 },
  footnote: { color: "#B8C6E7", fontSize: 13, lineHeight: 21 },
  footer: {
    color: "#90A3CF",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
  },
});
