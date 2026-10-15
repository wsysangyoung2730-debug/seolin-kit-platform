import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
import LuckyExperience from "../../src/components/lucky/LuckyExperience";
import {
  createLuckyState,
  defaultLuckyState,
  drawLucky,
  modes,
  newLuckyId,
  parsePrizeDrafts,
  prizeDrafts,
  remainingTotal,
  type DrawResult,
  type LuckyModeId,
  type LuckyState,
  type Prize,
  type PrizeDraft,
} from "../../src/tools/lucky-draw";
import { LuckyStore } from "../../src/tools/lucky-storage";
const store = new LuckyStore({
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, raw) => AsyncStorage.setItem(key, raw),
});
type Tab = "prizes" | "modes" | "history";
type Confirmation =
  { kind: "save"; prizes: Prize[] } | { kind: "reset" } | { kind: "temporary" };
export default function LuckyDraw() {
  const [state, setState] = useState<LuckyState>(defaultLuckyState);
  const current = useRef(state);
  const [drafts, setDrafts] = useState<PrizeDraft[]>(() =>
    prizeDrafts(state.prizes),
  );
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [localOnly, setLocalOnly] = useState(false);
  const temporary = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("prizes");
  const [mode, setMode] = useState<LuckyModeId | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [historyCount, setHistoryCount] = useState(20);
  const mounted = useRef(false);
  const loadId = useRef(0);
  const adopt = useCallback((next: LuckyState, updateDrafts = false) => {
    current.current = next;
    if (!mounted.current) return;
    setState(next);
    if (updateDrafts) setDrafts(prizeDrafts(next.prizes));
  }, []);
  const reload = useCallback(async () => {
    if (inFlight.current) return;
    const request = ++loadId.current;
    const recovering = store.recoveryRequired;
    inFlight.current = true;
    readyRef.current = false;
    setReady(false);
    setBusy(true);
    setError("");
    try {
      const next = await store.load();
      if (mounted.current && request === loadId.current) {
        adopt(next, true);
        readyRef.current = true;
        setReady(true);
        if (recovering) {
          setTab("history");
          setNotice("저장된 기록을 불러왔어요. 마지막 결과를 확인해 주세요.");
        }
      }
    } catch (reason) {
      if (mounted.current && request === loadId.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "저장된 내용을 불러오지 못했어요.",
        );
    } finally {
      inFlight.current = false;
      if (mounted.current && request === loadId.current) setBusy(false);
    }
  }, [adopt]);
  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);
  const dirty =
    JSON.stringify(drafts) !== JSON.stringify(prizeDrafts(state.prizes));
  const disabled = busy || !ready;
  async function replacePrizes(prizes: Prize[]) {
    if (inFlight.current || !readyRef.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const next = temporary.current
        ? createLuckyState(prizes)
        : await store.savePrizes(prizes);
      if (mounted.current) {
        adopt(next, true);
        setNotice(
          temporary.current
            ? "임시 상품 설정을 준비했어요. 뽑기 방식을 선택해 주세요."
            : "상품 설정을 저장했어요. 뽑기 방식을 선택해 주세요.",
        );
        setTab("modes");
        setConfirmation(null);
        setHistoryCount(20);
      }
    } catch (reason) {
      if (mounted.current) {
        setConfirmation(null);
        setError(
          reason instanceof Error
            ? reason.message
            : "상품 설정을 저장하지 못했어요.",
        );
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function requestSave() {
    try {
      const prizes = parsePrizeDrafts(drafts);
      setNotice("");
      if (state.history.length) setConfirmation({ kind: "save", prizes });
      else void replacePrizes(prizes);
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "상품을 확인해 주세요.",
      );
    }
  }
  async function resetRound() {
    if (inFlight.current || !readyRef.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const next = temporary.current
        ? createLuckyState(current.current.prizes)
        : await store.reset();
      if (mounted.current) {
        adopt(next, true);
        setConfirmation(null);
        setNotice(
          "수량과 결과 기록을 초기화했어요. 새 회차를 시작할 수 있어요.",
        );
        setHistoryCount(20);
      }
    } catch (reason) {
      if (mounted.current) {
        setConfirmation(null);
        setError(
          reason instanceof Error
            ? reason.message
            : "새 회차를 준비하지 못했어요.",
        );
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const onDraw = useCallback(
    async (selectedIndex?: number): Promise<DrawResult | null> => {
      if (!mode || !readyRef.current || inFlight.current || !mounted.current)
        return null;
      inFlight.current = true;
      setBusy(true);
      setError("");
      try {
        const outcome = temporary.current
          ? drawLucky(current.current, mode, { selectedIndex })
          : await store.draw(mode, selectedIndex);
        // Storage owns the result before animation. Leaving now cannot lose the drawn result.
        adopt(outcome.state);
        return mounted.current ? outcome.result : null;
      } catch (reason) {
        if (mounted.current)
          setError(
            reason instanceof Error
              ? reason.message
              : "추첨을 완료하지 못했어요. 다시 시도해 주세요.",
          );
        return null;
      } finally {
        inFlight.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [mode, adopt],
  );
  const exitExperience = useCallback(() => {
    setMode(null);
    setTab("modes");
  }, []);
  function enterTemporary() {
    if (store.recoveryRequired) {
      setConfirmation(null);
      setError("먼저 기록을 다시 불러와 마지막 결과를 확인해 주세요.");
      return;
    }
    loadId.current++;
    temporary.current = true;
    setLocalOnly(true);
    if (!readyRef.current) adopt(defaultLuckyState(), true);
    readyRef.current = true;
    setReady(true);
    setBusy(false);
    setError("");
    setConfirmation(null);
    setNotice("임시 모드로 전환했어요. 기존 저장 내용은 바뀌지 않아요.");
  }
  if (mode)
    return (
      <View style={{ flex: 1, backgroundColor: c.stage }}>
        {!!error && (
          <View style={styles.stageError}>
            <Text
              accessibilityRole="alert"
              style={{ color: "white", fontSize: 14, lineHeight: 21 }}
            >
              {error}
            </Text>
            <Button
              secondary
              label="상품 설정으로 돌아가기"
              disabled={busy}
              onPress={exitExperience}
            />
          </View>
        )}
        <LuckyExperience
          key={mode}
          mode={mode}
          onDraw={onDraw}
          onExit={exitExperience}
          disabled={busy || remainingTotal(state) === 0}
        />
      </View>
    );
  return (
    <Page>
      <Back title="태권뽑기" />
      <View style={s.row}>
        <AppIcon id="lucky-draw" size={72} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.badge}>수업 도구 · 9가지 뽑기</Text>
          <Title>오늘의 행운을 뽑아요</Title>
        </View>
      </View>
      <Copy>
        상품과 수량을 준비하고, 아이들이 좋아하는 방식으로 한 명씩 상품을 뽑아
        보세요.
      </Copy>
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>남은 뽑기</Text>
          <Text style={styles.big}>
            {ready ? remainingTotal(state) : "—"}
            <Text style={styles.unit}> 개</Text>
          </Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.summaryLabel}>상품 {state.prizes.length}종</Text>
          <Text style={styles.summaryLabel}>
            이번 회차 {state.history.length}명 참여
          </Text>
          <Text style={styles.summaryLabel}>
            {localOnly ? "임시 모드 · 저장 안 함" : "이 기기에 저장"}
          </Text>
        </View>
      </View>
      {!ready && !error && <Copy>저장된 상품과 결과를 불러오는 중이에요.</Copy>}
      {!!error && (
        <Card>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          {!localOnly && (
            <>
              <Button
                secondary
                label="다시 불러오기"
                disabled={busy}
                onPress={() => void reload()}
              />
              <Button
                secondary
                label="저장 없이 임시 모드로 진행"
                disabled={busy || store.recoveryRequired}
                onPress={() => setConfirmation({ kind: "temporary" })}
              />
            </>
          )}
        </Card>
      )}
      {localOnly && (
        <Text style={styles.hint}>
          임시 결과와 수량은 이 화면에서만 유지돼요. 화면을 나가면 사라지고,
          기존 저장 내용은 그대로 남아요.
        </Text>
      )}
      <View style={styles.tabs}>
        {(
          [
            { id: "prizes", label: "상품 관리" },
            { id: "modes", label: "뽑기 방식" },
            { id: "history", label: "결과 기록" },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item.id, disabled: busy }}
            disabled={busy}
            onPress={() => {
              setTab(item.id);
              setNotice("");
            }}
            style={[styles.tab, tab === item.id && styles.activeTab]}
          >
            <Text
              style={[styles.tabLabel, tab === item.id && { color: "white" }]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          {notice}
        </Text>
      )}
      {tab === "prizes" && (
        <>
          <View style={styles.heading}>
            <Text style={s.section}>어떤 상품을 넣을까요?</Text>
            <Text style={s.small}>{drafts.length} / 20종</Text>
          </View>
          <Text style={s.small}>
            예시 상품을 도장에 맞게 바꿔 주세요. 남은 수량 한 개마다 같은 확률로
            뽑혀요. 개별 1~100개, 전체 1,000개까지 설정할 수 있어요.
          </Text>
          {drafts.map((prize, index) => (
            <Card key={prize.id}>
              <View style={styles.heading}>
                <Text style={s.badge}>
                  {String(index + 1).padStart(2, "0")} ·{" "}
                  {prize.kind === "miss" ? "다음 기회" : "상품"}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${index + 1}번 상품 삭제`}
                  disabled={disabled || drafts.length === 1}
                  onPress={() =>
                    setDrafts((items) =>
                      items.filter((item) => item.id !== prize.id),
                    )
                  }
                  style={styles.remove}
                >
                  <Text
                    style={{
                      color:
                        disabled || drafts.length === 1 ? c.muted : "#A43E3E",
                      fontWeight: "700",
                    }}
                  >
                    삭제
                  </Text>
                </Pressable>
              </View>
              <TextInput
                accessibilityLabel={`${index + 1}번 상품 이름`}
                placeholder="상품 이름 · 1~30자"
                value={prize.name}
                editable={!disabled}
                onChangeText={(name) =>
                  setDrafts((items) =>
                    items.map((item) =>
                      item.id === prize.id ? { ...item, name } : item,
                    ),
                  )
                }
                style={s.input}
              />
              <View style={styles.quantityRow}>
                <Text style={s.heading}>처음 수량</Text>
                <TextInput
                  accessibilityLabel={`${index + 1}번 상품 수량`}
                  value={prize.quantity}
                  editable={!disabled}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  onChangeText={(quantity) =>
                    setDrafts((items) =>
                      items.map((item) =>
                        item.id === prize.id ? { ...item, quantity } : item,
                      ),
                    )
                  }
                  style={[s.input, styles.quantity]}
                />
                <Text style={s.small}>
                  개 · 현재 {state.remaining[prize.id] ?? 0}개 남음
                </Text>
              </View>
              <View style={styles.kindRow}>
                {(
                  [
                    { id: "prize", label: "상품" },
                    { id: "miss", label: "다음 기회" },
                  ] as const
                ).map((kind) => (
                  <Pressable
                    key={kind.id}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: prize.kind === kind.id,
                      disabled,
                    }}
                    disabled={disabled}
                    onPress={() =>
                      setDrafts((items) =>
                        items.map((item) =>
                          item.id === prize.id
                            ? { ...item, kind: kind.id }
                            : item,
                        ),
                      )
                    }
                    style={[
                      styles.kind,
                      prize.kind === kind.id && { backgroundColor: c.brand },
                    ]}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        color: prize.kind === kind.id ? "white" : c.brand,
                      }}
                    >
                      {kind.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          ))}
          <Button
            secondary
            label="+ 상품 추가"
            disabled={disabled || drafts.length >= 20}
            onPress={() =>
              setDrafts((items) => [
                ...items,
                { id: newLuckyId(), name: "", quantity: "1", kind: "prize" },
              ])
            }
          />
          <Button
            label={busy ? "저장 중…" : "상품 설정 저장하고 뽑기 준비"}
            disabled={disabled}
            onPress={requestSave}
          />
          {dirty && (
            <Text style={styles.hint}>
              아직 저장하지 않은 변경이 있어요. 상품 설정을 저장하면 새 회차로
              시작해요.
            </Text>
          )}
        </>
      )}
      {tab === "modes" && (
        <>
          <Text style={s.section}>어떻게 뽑아볼까요?</Text>
          <Copy>
            방식이 달라도 상품 확률은 같아요. 선택한 문·카드·멈추는 순간은
            연출이며 결과는 무작위로 정해져요.
          </Copy>
          {dirty && (
            <Card>
              <Copy>상품 변경 내용을 먼저 저장해 주세요.</Copy>
              <Button
                secondary
                label="상품 관리로"
                onPress={() => setTab("prizes")}
              />
            </Card>
          )}
          {ready && remainingTotal(state) === 0 && (
            <Card>
              <Text style={s.heading}>모든 상품을 뽑았어요!</Text>
              <Copy>
                결과 기록을 확인하거나 수량을 초기화해 새 회차를 준비해 주세요.
              </Copy>
              <Button
                label="새 회차 준비"
                disabled={busy}
                onPress={() => setConfirmation({ kind: "reset" })}
              />
            </Card>
          )}
          <View style={styles.modeGrid}>
            {modes.map((item, index) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} 시작`}
                accessibilityState={{
                  disabled: disabled || dirty || remainingTotal(state) === 0,
                }}
                disabled={disabled || dirty || remainingTotal(state) === 0}
                onPress={() => {
                  setError("");
                  setMode(item.id);
                }}
                style={({ pressed }) => [
                  styles.modeCard,
                  {
                    opacity:
                      disabled || dirty || remainingTotal(state) === 0
                        ? 0.45
                        : pressed
                          ? 0.8
                          : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.modeBadge,
                    {
                      backgroundColor:
                        index % 3 === 0
                          ? "#DDE6FF"
                          : index % 3 === 1
                            ? "#EAE0FF"
                            : "#E0F2ED",
                    },
                  ]}
                >
                  <Text style={styles.modeNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>
                <Text style={styles.modeLabel}>{item.label}</Text>
                <Text style={styles.modeMood}>{item.mood}</Text>
                <Text style={styles.modeInstruction}>{item.instruction}</Text>
                <Text style={styles.modeLink}>뽑으러 가기 →</Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.small}>
            모든 뽑기는 화면 터치로 진행해요. 미트는 터치로, 호랑이 기합은 기합
            버튼으로 참여하며 카메라나 음성 인식을 사용하지 않아요.
          </Text>
        </>
      )}
      {tab === "history" && (
        <>
          <View style={styles.heading}>
            <Text style={s.section}>이번 회차 결과</Text>
            <Text style={s.small}>{state.history.length}건</Text>
          </View>
          <Text style={s.small}>
            상품이 확정되면 연출이 끝나기 전에 기록돼요. 중간에 화면을 나가도
            여기서 확인할 수 있어요.{localOnly ? " 현재는 임시 모드예요." : ""}
          </Text>
          {!state.history.length ? (
            <Card>
              <Copy>
                아직 뽑은 결과가 없어요. 상품을 준비하고 첫 번째 뽑기를 시작해
                보세요.
              </Copy>
              <Button
                secondary
                label="뽑기 방식 보기"
                disabled={disabled}
                onPress={() => setTab("modes")}
              />
            </Card>
          ) : (
            state.history
              .slice(-historyCount)
              .reverse()
              .map((result, index) => (
                <Card key={result.id}>
                  <View style={styles.heading}>
                    <Text style={s.badge}>
                      #{state.history.length - index} ·{" "}
                      {result.kind === "miss" ? "다음 기회" : "당첨"}
                    </Text>
                    <Text style={s.small}>
                      {new Date(result.createdAt).toLocaleString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Text style={s.heading}>{result.prizeName}</Text>
                  <Text style={s.small}>
                    {modes.find((item) => item.id === result.mode)?.label}
                  </Text>
                </Card>
              ))
          )}
          {state.history.length > historyCount && (
            <Button
              secondary
              label="이전 결과 더 보기"
              onPress={() => setHistoryCount((value) => value + 20)}
            />
          )}
          <Button
            secondary
            label="수량·기록 초기화하고 새 회차"
            disabled={disabled || !state.history.length}
            onPress={() => setConfirmation({ kind: "reset" })}
          />
        </>
      )}
      <Modal
        visible={confirmation !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) setConfirmation(null);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={s.section}>
              {confirmation?.kind === "temporary"
                ? "임시 모드로 진행할까요?"
                : confirmation?.kind === "save"
                  ? "새 상품 설정으로 시작할까요?"
                  : "새 회차를 시작할까요?"}
            </Text>
            <Copy>
              {confirmation?.kind === "temporary"
                ? "기존 저장 내용은 바꾸지 않아요. 임시 결과는 화면을 나가면 사라져요."
                : "현재 결과 기록이 지워지고 모든 상품 수량이 처음 설정한 값으로 돌아가요."}
            </Copy>
            <Button
              disabled={busy}
              label={
                busy
                  ? "저장 중…"
                  : confirmation?.kind === "temporary"
                    ? "임시 모드로 진행"
                    : "초기화하고 시작"
              }
              onPress={() => {
                if (confirmation?.kind === "temporary") enterTemporary();
                else if (confirmation?.kind === "save")
                  void replacePrizes(confirmation.prizes);
                else void resetRound();
              }}
            />
            <Button
              secondary
              disabled={busy}
              label="취소"
              onPress={() => setConfirmation(null)}
            />
          </View>
        </View>
      </Modal>
    </Page>
  );
}
const styles = StyleSheet.create({
  summary: {
    backgroundColor: c.brand,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
  },
  summaryLabel: { color: "#DDE3FF", fontSize: 13, lineHeight: 21 },
  big: { color: "white", fontSize: 40, fontWeight: "800", marginTop: 4 },
  unit: { fontSize: 16, fontWeight: "700" },
  stats: { justifyContent: "center", gap: 5 },
  tabs: {
    flexDirection: "row",
    padding: 5,
    borderRadius: 16,
    backgroundColor: c.soft,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    padding: 6,
  },
  activeTab: { backgroundColor: c.brand },
  tabLabel: { color: c.brand, fontWeight: "700", fontSize: 14 },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  remove: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  quantity: {
    minWidth: 75,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  kindRow: { flexDirection: "row", gap: 8 },
  kind: {
    flex: 1,
    padding: 12,
    minHeight: 44,
    backgroundColor: c.soft,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  modeCard: {
    width: "48%",
    flexGrow: 1,
    minWidth: 130,
    backgroundColor: "white",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: c.border,
    gap: 9,
  },
  modeBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  modeNumber: { color: c.brand, fontWeight: "800", fontSize: 23 },
  modeLabel: { color: c.text, fontSize: 19, fontWeight: "800" },
  modeMood: { color: c.accent, fontWeight: "700", fontSize: 12 },
  modeInstruction: { color: c.muted, fontSize: 13, lineHeight: 20, flex: 1 },
  modeLink: { color: c.brand, fontSize: 13, fontWeight: "800", marginTop: 9 },
  hint: { color: c.muted, fontSize: 14, lineHeight: 22 },
  error: { color: "#A33D35", fontSize: 14, lineHeight: 22 },
  stageError: { backgroundColor: "#713C48", padding: 18, gap: 10 },
  overlay: {
    flex: 1,
    padding: 24,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    width: "100%",
    maxWidth: 450,
    padding: 24,
    backgroundColor: "white",
    borderRadius: 24,
    gap: 18,
  },
});
