import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
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
import TimerSession from "../../src/components/tools/TimerSession";
import {
  TABATA_STORAGE_KEY,
  createTabataPlan,
  decodeTabataSettings,
  defaultTabata,
  encodeTabataSettings,
  formatTabataDuration,
  parseTabataInteger,
  tabataSettingsError,
  tabataTotalSeconds,
  type TabataSettings,
} from "../../src/tools/tabata";

type Fields = {
  prepareSeconds: string;
  workSeconds: string;
  restSeconds: string;
  rounds: string;
};
const toFields = (settings: TabataSettings): Fields => ({
  prepareSeconds: String(settings.prepareSeconds),
  workSeconds: String(settings.workSeconds),
  restSeconds: String(settings.restSeconds),
  rounds: String(settings.rounds),
});

export default function TabataSetup() {
  const [fields, setFields] = useState(() => toFields(defaultTabata));
  const [sound, setSound] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [notice, setNotice] = useState("");
  const [session, setSession] = useState<TabataSettings | null>(null);
  const sessionPlan = useMemo(
    () => (session ? createTabataPlan(session) : null),
    [session],
  );
  const closeSession = useCallback(() => setSession(null), []);
  const active = useRef(false);
  const operation = useRef(0);
  const saving = useRef(false);

  function applySettings(settings: TabataSettings) {
    setFields(toFields(settings));
    setSound(settings.sound);
  }

  async function reload() {
    if (saving.current) return;
    const id = ++operation.current;
    setReady(false);
    setLoadError(false);
    setSaveError(false);
    setNotice("");
    try {
      const stored = decodeTabataSettings(
        await AsyncStorage.getItem(TABATA_STORAGE_KEY),
      );
      if (!active.current || id !== operation.current) return;
      applySettings(stored);
      setTemporary(false);
      setReady(true);
    } catch {
      if (!active.current || id !== operation.current) return;
      setLoadError(true);
    }
  }

  useEffect(() => {
    active.current = true;
    void reload();
    return () => {
      active.current = false;
      operation.current += 1;
    };
  }, []);

  const settings: TabataSettings = {
    prepareSeconds: parseTabataInteger(fields.prepareSeconds),
    workSeconds: parseTabataInteger(fields.workSeconds),
    restSeconds: parseTabataInteger(fields.restSeconds),
    rounds: parseTabataInteger(fields.rounds),
    sound,
  };
  const problem = tabataSettingsError(settings);
  const editable = ready && !busy;

  async function save(next: TabataSettings, runAfter: boolean, reset = false) {
    if (saving.current) return;
    const error = tabataSettingsError(next);
    if (error) {
      setNotice(error);
      return;
    }
    saving.current = true;
    setBusy(true);
    setSaveError(false);
    setNotice("");
    const id = ++operation.current;
    try {
      await AsyncStorage.setItem(
        TABATA_STORAGE_KEY,
        encodeTabataSettings(next),
      );
      if (!active.current || id !== operation.current) return;
      if (reset) applySettings(next);
      setReady(true);
      setLoadError(false);
      setTemporary(false);
      setNotice("설정을 이 기기에 저장했어요.");
      if (runAfter) setSession(next);
    } catch {
      if (!active.current || id !== operation.current) return;
      setSaveError(true);
      setNotice(
        "저장하지 못했어요. 다시 저장하거나 이번에는 저장 없이 시작할 수 있어요.",
      );
    } finally {
      saving.current = false;
      if (active.current && id === operation.current) setBusy(false);
    }
  }

  function startUnsaved() {
    if (problem) {
      setNotice(problem);
      return;
    }
    setSession({ ...settings });
  }

  if (session && sessionPlan) {
    return (
      <TimerSession
        title="타바타 타이머"
        plan={sessionPlan}
        sound={session.sound}
        onExit={closeSession}
      />
    );
  }

  return (
    <Page
      footer={
        <View style={{ gap: 10 }}>
          <Button
            label={
              busy
                ? "저장하는 중…"
                : temporary
                  ? "저장 없이 타바타 시작"
                  : "저장하고 타바타 시작"
            }
            disabled={!editable}
            onPress={() =>
              temporary ? startUnsaved() : void save(settings, true)
            }
          />
          {saveError && ready && !temporary && (
            <Button
              label="이번에는 저장 없이 시작"
              secondary
              disabled={busy}
              onPress={startUnsaved}
            />
          )}
        </View>
      }
    >
      <Back title="타바타 타이머" />
      <View style={s.row}>
        <AppIcon id="tabata" />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.badge}>수업 도구 · 운동과 휴식을 한 번에</Text>
          <Title>함께 움직일 시간</Title>
        </View>
      </View>

      {loadError && (
        <Card>
          <Text accessibilityRole="alert" style={s.heading}>
            저장된 설정을 불러오지 못했어요
          </Text>
          <Copy>
            다시 불러오거나 기본 설정을 사용할 수 있어요. 기존 설정은 자동으로
            바뀌지 않아요.
          </Copy>
          <Button
            label="다시 불러오기"
            disabled={busy}
            onPress={() => void reload()}
          />
          <Button
            label="저장 없이 사용"
            secondary
            disabled={busy}
            onPress={() => {
              applySettings({ ...defaultTabata });
              setTemporary(true);
              setReady(true);
              setLoadError(false);
              setSaveError(false);
              setNotice("");
            }}
          />
          <Button
            label="기본 설정으로 다시 저장"
            secondary
            disabled={busy}
            onPress={() => void save({ ...defaultTabata }, false, true)}
          />
        </Card>
      )}
      {!ready && !loadError && <Copy>저장된 설정을 불러오고 있어요.</Copy>}
      {temporary && (
        <Card>
          <Copy>
            이번 설정은 저장하지 않아요. 기존에 저장된 설정은 그대로 유지돼요.
          </Copy>
          <Button
            label="저장된 설정 다시 불러오기"
            secondary
            disabled={busy}
            onPress={() => void reload()}
          />
        </Card>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>총 진행 시간</Text>
        <Text style={styles.duration}>
          {problem
            ? "시간을 설정해 주세요"
            : formatTabataDuration(tabataTotalSeconds(settings))}
        </Text>
        <Text style={styles.summaryCopy}>
          준비 시간을 포함하며, 마지막 운동이 끝나면 바로 완료해요.
        </Text>
        {!problem && (
          <View style={styles.summaryMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{settings.rounds}세트</Text>
              <Text style={styles.summaryCopy}>반복 횟수</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {formatTabataDuration(settings.workSeconds * settings.rounds)}
              </Text>
              <Text style={styles.summaryCopy}>운동 시간 합계</Text>
            </View>
          </View>
        )}
      </View>

      <Card>
        <Text style={s.heading}>빠르게 설정하기</Text>
        <View style={styles.presets}>
          {[
            {
              label: "20초 / 10초 × 8",
              workSeconds: 20,
              restSeconds: 10,
              rounds: 8,
            },
            {
              label: "30초 / 15초 × 6",
              workSeconds: 30,
              restSeconds: 15,
              rounds: 6,
            },
          ].map((preset) => (
            <Pressable
              key={preset.label}
              accessibilityRole="button"
              accessibilityLabel={`운동 ${preset.workSeconds}초, 휴식 ${preset.restSeconds}초, ${preset.rounds}세트로 설정`}
              accessibilityState={{ disabled: !editable }}
              disabled={!editable}
              onPress={() => {
                setFields(toFields({ ...defaultTabata, ...preset }));
                setNotice("");
              }}
              style={({ pressed }) => [
                styles.preset,
                (!editable || pressed) && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.presetText}>{preset.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.small}>
          운동 / 휴식 × 세트 · 준비 시간은 10초로 설정돼요.
        </Text>
      </Card>

      <Card>
        <Text style={s.heading}>내 수업에 맞추기</Text>
        {(
          [
            [
              "prepareSeconds",
              "준비 시간",
              "초",
              "0~60초 · 0초면 바로 운동을 시작해요",
            ],
            ["workSeconds", "운동 시간", "초", "1~3,600초"],
            [
              "restSeconds",
              "휴식 시간",
              "초",
              "0~3,600초 · 0초면 휴식 없이 이어져요",
            ],
            ["rounds", "반복 세트", "세트", "1~99세트"],
          ] as const
        ).map(([key, label, unit, hint]) => (
          <View key={key} style={styles.field}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <Text style={s.small}>{hint}</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                accessibilityLabel={`${label} (${unit})`}
                value={fields[key]}
                onChangeText={(value) => {
                  setFields((current) => ({ ...current, [key]: value }));
                  setNotice("");
                }}
                keyboardType="number-pad"
                selectTextOnFocus
                maxLength={4}
                editable={editable}
                style={[s.input, styles.input]}
              />
              <Text style={s.small}>{unit}</Text>
            </View>
          </View>
        ))}
        <View style={s.divider} />
        <View style={s.row}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.fieldLabel}>소리 안내</Text>
            <Text style={s.small}>
              기기의 소리를 켜고 음량을 확인해 주세요.
            </Text>
          </View>
          <Switch
            accessibilityLabel="소리 안내"
            value={sound}
            onValueChange={setSound}
            disabled={!editable}
            trackColor={{ true: c.accent }}
          />
        </View>
        {!temporary && (
          <Button
            label="설정만 저장"
            secondary
            disabled={!editable}
            onPress={() => void save(settings, false)}
          />
        )}
      </Card>

      {!!notice && (
        <Text
          accessibilityRole="alert"
          style={[
            s.copy,
            { color: saveError || problem ? c.coral : c.positive },
          ]}
        >
          {notice}
        </Text>
      )}
      {ready && !!problem && !notice && (
        <Text accessibilityRole="alert" style={[s.copy, { color: c.coral }]}>
          {problem}
        </Text>
      )}

      <Card>
        <Text style={s.heading}>진행 순서 미리보기</Text>
        {problem ? (
          <Copy>유효한 시간을 입력하면 진행 순서를 볼 수 있어요.</Copy>
        ) : (
          <>
            <View style={styles.sequence}>
              {settings.prepareSeconds > 0 && (
                <Text style={styles.prepare}>
                  준비 {settings.prepareSeconds}초
                </Text>
              )}
              <Text style={styles.work}>운동 {settings.workSeconds}초</Text>
              {settings.restSeconds > 0 && settings.rounds > 1 && (
                <Text style={styles.rest}>휴식 {settings.restSeconds}초</Text>
              )}
              <Text style={styles.repeat}>× {settings.rounds}세트</Text>
            </View>
            <Copy>
              준비는 처음에 한 번만 진행해요. {settings.rounds}세트의 마지막
              운동 뒤에는 휴식 없이 완료돼요.
            </Copy>
          </>
        )}
        <Text style={s.small}>
          TV에 화면을 미러링하면 남은 시간과 현재 세트를 크게 볼 수 있어요. 앱을
          벗어나면 타이머가 일시정지돼요.
        </Text>
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: c.brand, borderRadius: 26, padding: 26, gap: 12 },
  summaryLabel: { color: "#D6DCFF", fontSize: 15, fontWeight: "700" },
  duration: {
    color: "white",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  summaryCopy: { color: "#D6DCFF", fontSize: 13, lineHeight: 20 },
  summaryMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 10,
  },
  metric: {
    flexGrow: 1,
    gap: 5,
    backgroundColor: "#34428A",
    padding: 16,
    borderRadius: 16,
  },
  metricValue: { color: "white", fontSize: 20, fontWeight: "800" },
  presets: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  preset: {
    flexGrow: 1,
    minHeight: 54,
    backgroundColor: c.soft,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  presetText: { color: c.brand, fontSize: 15, fontWeight: "700" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    paddingVertical: 7,
  },
  fieldLabel: { color: c.text, fontSize: 16, fontWeight: "700" },
  inputGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { width: 94, textAlign: "center", fontSize: 20, fontWeight: "700" },
  sequence: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prepare: {
    color: c.brand,
    backgroundColor: c.soft,
    padding: 12,
    borderRadius: 12,
    fontWeight: "700",
  },
  work: {
    color: c.positive,
    backgroundColor: c.positiveSoft,
    padding: 12,
    borderRadius: 12,
    fontWeight: "700",
  },
  rest: {
    color: c.brand,
    backgroundColor: c.soft,
    padding: 12,
    borderRadius: 12,
    fontWeight: "700",
  },
  repeat: { color: c.text, padding: 12, fontWeight: "700" },
});
