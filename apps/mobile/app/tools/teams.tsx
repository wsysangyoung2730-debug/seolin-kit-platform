import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AppIcon,
  Back,
  Button,
  Card,
  Copy,
  Title,
  c,
  s,
} from "../../src/components/ui";
import {
  decodeRoster,
  drawPeople,
  encodeRoster,
  makeTeams,
  parseRoster,
  readCount,
  remainingPeople,
  ROSTER_KEY,
  type DrawRound,
  type Participant,
} from "../../src/tools/teams";

type Mode = "teams" | "draw";
const teamColors = [c.brand, c.positive, c.accent, c.coral];

export default function TeamsTool() {
  const [mode, setMode] = useState<Mode>("teams");
  const [text, setText] = useState("");
  const [teamCount, setTeamCount] = useState("2");
  const [drawCount, setDrawCount] = useState("1");
  const [excludePrevious, setExcludePrevious] = useState(true);
  const [teams, setTeams] = useState<Participant[][]>([]);
  const [history, setHistory] = useState<DrawRound[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [hasSaved, setHasSaved] = useState(false);
  const mounted = useRef(false);
  const request = useRef(0);
  const storageBusy = useRef(false);
  const historyRef = useRef<DrawRound[]>([]);
  const scrollView = useRef<ScrollView>(null);
  const resultPosition = useRef(0);
  const scrollPending = useRef(false);
  const roster = parseRoster(text);
  const people = roster.value ?? [];
  const pool = remainingPeople(people, history, excludePrevious);
  const busy = loading || saving;
  const latest = history.at(-1);
  const repeatedNames =
    new Set(people.map((person) => person.name)).size < people.length;

  function showResults() {
    if (scrollPending.current && resultPosition.current > 0) {
      scrollView.current?.scrollTo({
        y: resultPosition.current - 16,
        animated: false,
      });
      scrollPending.current = false;
    }
  }

  useEffect(showResults, [teams, history]);

  function clearDraws() {
    historyRef.current = [];
    setHistory([]);
    setShowHistory(false);
  }

  function replaceRoster(next: string) {
    setText(next);
    setTeams([]);
    resultPosition.current = 0;
    scrollPending.current = false;
    clearDraws();
    setNotice("");
    setStorageNotice("");
  }

  async function loadRoster() {
    const current = ++request.current;
    setLoading(true);
    setStorageError("");
    try {
      const raw = await AsyncStorage.getItem(ROSTER_KEY);
      const restored = decodeRoster(raw);
      if (!mounted.current || current !== request.current) return;
      replaceRoster(restored);
      setHasSaved(raw !== null);
      if (raw !== null) setStorageNotice("이 기기에 저장한 명단을 불러왔어요.");
    } catch {
      if (!mounted.current || current !== request.current) return;
      setStorageError(
        "저장된 명단을 불러오지 못했어요. 다시 불러오거나 새 명단으로 이용해 주세요. 새로 저장하기 전까지 기존 저장 내용은 유지돼요.",
      );
    } finally {
      if (mounted.current && current === request.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    void loadRoster();
    return () => {
      mounted.current = false;
      request.current++;
    };
  }, []);

  async function saveRoster(remove = false) {
    if (storageBusy.current || loading) return;
    if (!remove && roster.error) {
      setNotice(roster.error);
      return;
    }
    storageBusy.current = true;
    setSaving(true);
    setStorageNotice("");
    try {
      if (remove) await AsyncStorage.removeItem(ROSTER_KEY);
      else await AsyncStorage.setItem(ROSTER_KEY, encodeRoster(text));
      if (!mounted.current) return;
      setHasSaved(!remove);
      setStorageError("");
      setStorageNotice(
        remove
          ? "기기에 저장한 명단을 삭제했어요. 지금 입력한 명단은 화면에 남아 있어요."
          : "이 기기에 명단을 저장했어요. 다음에 다시 불러올 수 있어요.",
      );
    } catch {
      if (mounted.current)
        setStorageError(
          remove
            ? "저장 명단을 삭제하지 못했어요. 다시 시도해 주세요."
            : "명단을 저장하지 못했어요. 입력한 명단으로 계속 이용할 수 있어요.",
        );
    } finally {
      storageBusy.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  function splitTeams() {
    Keyboard.dismiss();
    if (roster.error) return setNotice(roster.error);
    const count = readCount(teamCount, 2, Math.min(people.length, 20));
    if (count.error) return setNotice(count.error);
    scrollPending.current = true;
    setTeams(makeTeams(people, count.value!));
    setNotice("");
  }

  function draw() {
    Keyboard.dismiss();
    if (roster.error) return setNotice(roster.error);
    if (!pool.length)
      return setNotice(
        "모두 뽑혔어요. 추첨 기록을 초기화해 다시 시작해 주세요.",
      );
    if (historyRef.current.length >= 100)
      return setNotice(
        "추첨 기록이 100회 쌓였어요. 기록을 초기화한 뒤 다시 뽑아 주세요.",
      );
    const count = readCount(drawCount, 1, pool.length);
    if (count.error) return setNotice(count.error);
    const result = drawPeople(
      people,
      count.value!,
      historyRef.current,
      excludePrevious,
    );
    if (result.error) return setNotice(result.error);
    const next = [...historyRef.current, result.value!];
    scrollPending.current = true;
    historyRef.current = next;
    setHistory(next);
    setNotice("");
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={s.page}>
      <ScrollView
        ref={scrollView}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <Back title="팀 나누기 & 랜덤 뽑기" />
        <View style={s.row}>
          <AppIcon id="teams" size={72} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.badge}>수업 도구</Text>
            <Title>함께할 준비, 끝!</Title>
            <Text style={s.small}>팀도 순서도 공평하게 정해요</Text>
          </View>
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {(
            [
              ["teams", "팀 나누기"],
              ["draw", "랜덤 뽑기"],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === key }}
              onPress={() => {
                setMode(key);
                setNotice("");
                resultPosition.current = 0;
                scrollPending.current = false;
              }}
              style={[styles.tab, mode === key && styles.activeTab]}
            >
              <Text
                style={[styles.tabText, mode === key && { color: "white" }]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Card>
          <View style={styles.spread}>
            <Text style={s.heading}>참여 명단</Text>
            <Text style={styles.pill}>
              {roster.value ? `${people.length}명` : "최대 100명"}
            </Text>
          </View>
          <TextInput
            accessibilityLabel="참여 명단, 한 줄에 한 명"
            multiline
            textAlignVertical="top"
            autoCorrect={false}
            placeholder={
              "이름을 한 줄에 한 명씩 입력해 주세요\n예: 김민수\n이지우\n박서준"
            }
            placeholderTextColor={c.muted}
            value={text}
            editable={!busy}
            onChangeText={replaceRoster}
            style={[s.input, { minHeight: 155 }]}
          />
          <Text style={s.small}>
            이름당 30자까지 입력할 수 있어요. 명단을 수정하면 팀과 추첨 기록이
            초기화돼요.
          </Text>
          {repeatedNames && (
            <Text style={styles.info}>
              같은 이름은 입력 순서의 번호로 구분해요. 같은 학생을 두 번 입력한
              것은 아닌지 확인해 주세요.
            </Text>
          )}
          {!!text.trim() && !!roster.error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {roster.error}
            </Text>
          )}
          {loading && <Copy>저장 명단을 불러오고 있어요…</Copy>}
          {!!storageError && (
            <View style={{ gap: 10 }}>
              <Text accessibilityRole="alert" style={styles.error}>
                {storageError}
              </Text>
              <Button
                secondary
                label="저장 명단 다시 불러오기"
                disabled={busy}
                onPress={() => void loadRoster()}
              />
            </View>
          )}
          <Button
            secondary
            label={
              saving
                ? "처리하는 중…"
                : storageError
                  ? "현재 명단으로 새로 저장"
                  : "이 기기에 명단 저장"
            }
            disabled={busy || !roster.value}
            onPress={() => void saveRoster()}
          />
          {(hasSaved || !!storageError) && (
            <Button
              secondary
              label="기기에 저장한 명단 삭제"
              disabled={busy}
              onPress={() => void saveRoster(true)}
            />
          )}
          {!!storageNotice && (
            <Text accessibilityLiveRegion="polite" style={styles.info}>
              {storageNotice}
            </Text>
          )}
          <Text style={s.small}>
            저장 버튼을 눌렀을 때만 이 기기에 보관해요. 명단은 서버로 전송하지
            않아요.
          </Text>
        </Card>

        {mode === "teams" ? (
          <Card>
            <Text style={s.heading}>몇 팀으로 나눌까요?</Text>
            <View style={s.row}>
              <TextInput
                accessibilityLabel="팀 수"
                keyboardType="number-pad"
                value={teamCount}
                onChangeText={(value) => {
                  setTeamCount(value);
                  setTeams([]);
                  setNotice("");
                }}
                style={[s.input, styles.countInput]}
              />
              <Text style={[s.copy, { flex: 1 }]}>
                팀 · 2~{Math.max(2, Math.min(people.length, 20))}개
              </Text>
            </View>
            <Text style={s.small}>
              모두 한 팀에 한 번씩 배정돼요. 팀별 인원 차이는 최대 1명이에요.
            </Text>
            <Button
              label={teams.length ? "다시 팀 나누기" : "팀 나누기"}
              disabled={busy}
              onPress={splitTeams}
            />
          </Card>
        ) : (
          <Card>
            <Text style={s.heading}>몇 명을 뽑을까요?</Text>
            <View style={s.row}>
              <TextInput
                accessibilityLabel="추첨 인원"
                keyboardType="number-pad"
                value={drawCount}
                onChangeText={(value) => {
                  setDrawCount(value);
                  setNotice("");
                }}
                style={[s.input, styles.countInput]}
              />
              <Text style={[s.copy, { flex: 1 }]}>
                명 · 현재 {pool.length}명 추첨 가능
              </Text>
            </View>
            <View style={s.row}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.heading}>이미 뽑힌 사람 제외</Text>
                <Text style={s.small}>
                  켜면 이전 추첨 기록에 있는 사람을 제외해요.
                </Text>
              </View>
              <Switch
                accessibilityLabel="이미 뽑힌 사람 제외"
                value={excludePrevious}
                onValueChange={(value) => {
                  setExcludePrevious(value);
                  setNotice("");
                }}
                trackColor={{ true: c.accent }}
              />
            </View>
            {!!people.length && !pool.length && (
              <Text style={styles.info}>
                모두 뽑혔어요! 추첨 기록을 초기화하면 전원이 다시 참여해요.
              </Text>
            )}
            <Button
              label={latest ? "다음 사람 뽑기" : "랜덤으로 뽑기"}
              disabled={busy}
              onPress={draw}
            />
            {!!history.length && (
              <Button
                secondary
                label="추첨 기록 초기화 · 전원 다시 참여"
                onPress={() => {
                  clearDraws();
                  setNotice("");
                }}
              />
            )}
          </Card>
        )}

        {!!notice && (
          <Text accessibilityRole="alert" style={styles.error}>
            {notice}
          </Text>
        )}

        {mode === "teams" && !!teams.length && (
          <View
            style={{ gap: 16 }}
            onLayout={(event) => {
              resultPosition.current = event.nativeEvent.layout.y;
              showResults();
            }}
          >
            <Text accessibilityLiveRegion="polite" style={s.section}>
              {people.length}명, {teams.length}팀 준비 완료!
            </Text>
            {teams.map((members, index) => (
              <Card
                key={index}
                style={{
                  borderTopWidth: 5,
                  borderTopColor: teamColors[index % teamColors.length],
                }}
              >
                <View style={styles.spread}>
                  <Text style={s.section}>{index + 1}팀</Text>
                  <Text style={s.badge}>{members.length}명</Text>
                </View>
                <View style={styles.names}>
                  {members.map((person) => (
                    <Text key={person.id} style={styles.person}>
                      {person.label}
                    </Text>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}

        {mode === "draw" && latest && (
          <View
            style={{ gap: 22 }}
            onLayout={(event) => {
              resultPosition.current = event.nativeEvent.layout.y;
              showResults();
            }}
          >
            <Card style={styles.drawResult}>
              <Text style={{ color: "#D6DDFF", fontWeight: "700" }}>
                이번 주인공 · {history.length}번째 추첨
              </Text>
              <View accessibilityLiveRegion="polite" style={{ gap: 14 }}>
                {latest.people.map((person) => (
                  <Text key={person.id} style={styles.winner}>
                    {person.label}
                  </Text>
                ))}
              </View>
              <Text style={{ color: "#D6DDFF" }}>함께할 차례예요!</Text>
            </Card>
            <Card>
              <Text style={s.heading}>추첨 기록 · {history.length}회</Text>
              {[...history]
                .reverse()
                .slice(0, showHistory ? history.length : 5)
                .map((round, index) => (
                  <View key={history.length - index} style={styles.historyRow}>
                    <Text style={styles.historyNumber}>
                      {history.length - index}회
                    </Text>
                    <Text style={[s.copy, { flex: 1, color: c.text }]}>
                      {round.people.map((person) => person.label).join(", ")}
                    </Text>
                  </View>
                ))}
              {history.length > 5 && (
                <Button
                  secondary
                  label={
                    showHistory ? "최근 5회만 보기" : "전체 추첨 기록 보기"
                  }
                  onPress={() => setShowHistory(!showHistory)}
                />
              )}
              <Text style={s.small}>
                기록은 현재 화면에서 최대 100회까지 유지돼요. 명단을 바꾸거나 이
                화면을 나가면 사라져요.
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: c.soft,
    borderRadius: 18,
    padding: 5,
    gap: 5,
  },
  tab: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    padding: 10,
  },
  activeTab: { backgroundColor: c.brand },
  tabText: { color: c.brand, fontWeight: "800", fontSize: 16 },
  spread: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  pill: {
    backgroundColor: c.soft,
    color: c.brand,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  countInput: {
    width: 88,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  info: { color: c.positive, lineHeight: 23, fontSize: 14 },
  error: { color: "#B53F39", fontSize: 15, lineHeight: 24 },
  names: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  person: {
    color: c.text,
    backgroundColor: c.soft,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    fontSize: 22,
    fontWeight: "700",
    flexShrink: 1,
  },
  drawResult: {
    backgroundColor: c.brand,
    borderColor: c.brand,
    padding: 26,
    gap: 24,
  },
  winner: { color: "white", fontSize: 36, lineHeight: 48, fontWeight: "800" },
  historyRow: {
    flexDirection: "row",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    paddingBottom: 12,
  },
  historyNumber: {
    color: c.brand,
    fontSize: 15,
    fontWeight: "700",
    width: 44,
    paddingTop: 3,
  },
});
