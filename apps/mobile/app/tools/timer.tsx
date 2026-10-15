import { useCallback, useEffect, useRef, useState } from "react";
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
  buildClassroomPlan,
  classroomFields,
  decodeClassroom,
  defaultClassroomSettings,
  parseClassroom,
  type ClassroomFields,
  type ClassroomSettings,
} from "../../src/tools/timer-classroom";
import { formatTimer, totalDuration } from "../../src/tools/timer-engine";
import { useTimerPreferences } from "../../src/tools/timer-preferences";

export default function ClassroomTimer() {
  const preferences = useTimerPreferences(
    "seolin.classroom-timer.settings.v1",
    defaultClassroomSettings,
    decodeClassroom,
  );
  const [fields, setFields] = useState<ClassroomFields>(() =>
    classroomFields(defaultClassroomSettings),
  );
  const [session, setSession] = useState<ClassroomSettings | null>(null);
  const [notice, setNotice] = useState("");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    setFields(classroomFields(preferences.settings));
  }, [preferences.settings]);
  const exit = useCallback(() => setSession(null), []);
  const disabled = !preferences.ready || preferences.busy;
  const parsed = parseClassroom(fields);
  const plan = parsed.settings ? buildClassroomPlan(parsed.settings) : [];
  function field(key: keyof Omit<ClassroomFields, "sound">, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setNotice("");
  }
  async function launch(withoutSaving = false) {
    const value = parseClassroom(fields);
    if (!value.settings) {
      setNotice(value.error ?? "시간을 확인해 주세요.");
      return;
    }
    setNotice("");
    if (withoutSaving) {
      preferences.useWithoutSaving();
      setSession(value.settings);
    } else if (await preferences.save(value.settings)) {
      if (alive.current) setSession(value.settings);
    }
  }
  if (session)
    return (
      <TimerSession
        title="수업 타이머"
        plan={buildClassroomPlan(session)}
        sound={session.sound}
        onExit={exit}
      />
    );
  return (
    <Page
      footer={
        <Button
          label={
            preferences.busy
              ? "설정 저장 중…"
              : preferences.error && preferences.ready
                ? "저장 다시 시도하고 준비"
                : "타이머 준비하기"
          }
          disabled={disabled}
          onPress={() => void launch()}
        />
      }
    >
      <Back title="수업 타이머" />
      <View style={s.row}>
        <AppIcon id="timer" size={72} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={s.badge}>수업 도구</Text>
          <Title>시간을 정하고, 함께 집중해요</Title>
        </View>
      </View>
      <Copy>
        기본기 연습부터 정리 시간까지. 수업에 맞는 시간을 큰 화면으로 보여
        주세요.
      </Copy>
      {preferences.loading && <Copy>저장한 설정을 불러오는 중이에요.</Copy>}
      {!!preferences.error && (
        <Card>
          <Text accessibilityRole="alert" style={styles.error}>
            {preferences.error}
          </Text>
          {!preferences.ready && (
            <Button
              secondary
              label="다시 불러오기"
              onPress={preferences.reload}
            />
          )}
          <Button
            secondary
            disabled={preferences.busy}
            label={
              preferences.ready
                ? "이번에는 저장 없이 준비"
                : "기본 설정으로 시작 · 저장 안 함"
            }
            onPress={() =>
              preferences.ready
                ? void launch(true)
                : preferences.useWithoutSaving()
            }
          />
        </Card>
      )}
      {preferences.localOnly && (
        <Text style={s.small}>
          이번 설정은 이 화면에서만 사용돼요. 기존 저장 내용은 바뀌지 않아요.
        </Text>
      )}
      <Card>
        <View style={styles.section}>
          <Text style={styles.number}>01</Text>
          <Text style={s.heading}>한 번에 진행할 시간</Text>
        </View>
        <View style={styles.timeRow}>
          <Field
            label="분"
            accessibilityLabel="수업 시간 분, 0부터 59"
            value={fields.minutes}
            onChangeText={(value) => field("minutes", value)}
            disabled={disabled}
            large
            maxLength={2}
          />
          <Text style={styles.colon}>:</Text>
          <Field
            label="초"
            accessibilityLabel="수업 시간 초, 0부터 59"
            value={fields.seconds}
            onChangeText={(value) => field("seconds", value)}
            disabled={disabled}
            large
            maxLength={2}
          />
        </View>
        <View style={styles.presets}>
          {[1, 3, 5, 10].map((minutes) => (
            <Pressable
              key={minutes}
              accessibilityRole="button"
              accessibilityLabel={`${minutes}분으로 설정`}
              accessibilityState={{
                disabled,
                selected:
                  fields.minutes === String(minutes) &&
                  Number(fields.seconds) === 0,
              }}
              disabled={disabled}
              onPress={() => {
                field("minutes", String(minutes));
                field("seconds", "0");
              }}
              style={({ pressed }) => [
                styles.preset,
                fields.minutes === String(minutes) &&
                  Number(fields.seconds) === 0 &&
                  styles.selectedPreset,
                { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  fields.minutes === String(minutes) &&
                    Number(fields.seconds) === 0 && { color: "white" },
                ]}
              >
                {minutes}분
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card>
        <View style={styles.section}>
          <Text style={styles.number}>02</Text>
          <Text style={s.heading}>수업 흐름 설정</Text>
        </View>
        <Setting label="시작 전 준비" hint="맨 처음에만 적용 · 0~60초">
          <Field
            label="초"
            accessibilityLabel="준비 시간 초, 0부터 60"
            value={fields.preparation}
            onChangeText={(value) => field("preparation", value)}
            disabled={disabled}
            maxLength={2}
          />
        </Setting>
        <View style={s.divider} />
        <Setting label="반복 횟수" hint="같은 수업 시간을 반복 · 1~30회">
          <Field
            label="회"
            accessibilityLabel="반복 횟수, 1부터 30"
            value={fields.rounds}
            onChangeText={(value) => field("rounds", value)}
            disabled={disabled}
            maxLength={2}
          />
        </Setting>
        <View style={s.divider} />
        <Setting
          label="회차 사이 휴식"
          hint={
            Number(fields.rounds) === 1
              ? "2회 이상일 때 적용 · 0~600초"
              : "마지막 회차 뒤에는 쉬지 않아요 · 0~600초"
          }
        >
          <Field
            label="초"
            accessibilityLabel="회차 사이 휴식 초, 0부터 600"
            value={fields.rest}
            onChangeText={(value) => field("rest", value)}
            disabled={disabled}
            maxLength={3}
          />
        </Setting>
        <View style={s.divider} />
        <Setting label="효과음" hint="구간 시작·마지막 3초·완료 알림">
          <Switch
            accessibilityLabel="타이머 효과음"
            disabled={disabled}
            value={fields.sound}
            onValueChange={(sound) =>
              setFields((value) => ({ ...value, sound }))
            }
            trackColor={{ true: c.accent }}
          />
        </Setting>
      </Card>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>오늘의 타이머</Text>
        <Text style={styles.total}>
          {parsed.settings
            ? formatTimer(totalDuration(plan) / 1000)
            : "시간 확인"}
        </Text>
        <Text style={styles.summaryCopy}>
          {parsed.settings
            ? `${parsed.settings.rounds}회 진행 · 준비와 휴식 포함`
            : parsed.error}
        </Text>
      </View>
      {!!notice && (
        <Text accessibilityRole="alert" style={styles.error}>
          {notice}
        </Text>
      )}
      <Card>
        <Text style={s.heading}>큰 화면으로 함께 보기</Text>
        <Copy>
          휴대폰·태블릿을 TV에 미러링해 주세요. 기기를 가로로 돌리면 숫자를 더
          넓게 볼 수 있어요.
        </Copy>
        <Text style={s.small}>
          준비 화면을 연 뒤 시작을 눌러요. 다른 앱으로 이동하면 시간이 멈추고,
          돌아온 뒤 직접 이어서 진행할 수 있어요. 전체 시간은 24시간 이내로
          설정해 주세요.
        </Text>
      </Card>
    </Page>
  );
}
function Setting({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.setting}>
      <View style={{ flex: 1, minWidth: 150, gap: 5 }}>
        <Text style={s.heading}>{label}</Text>
        <Text style={s.small}>{hint}</Text>
      </View>
      {children}
    </View>
  );
}
function Field({
  value,
  onChangeText,
  label,
  accessibilityLabel,
  disabled,
  large = false,
  maxLength,
}: {
  value: string;
  onChangeText: (value: string) => void;
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  large?: boolean;
  maxLength: number;
}) {
  return (
    <View style={[styles.field, large && { flex: 1 }]}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        editable={!disabled}
        maxLength={maxLength}
        selectTextOnFocus
        style={[
          styles.input,
          large && styles.largeInput,
          disabled && { opacity: 0.5 },
        ]}
      />
      <Text style={s.small}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { flexDirection: "row", alignItems: "center", gap: 10 },
  number: { color: c.accent, fontSize: 14, fontWeight: "800" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  colon: { color: c.muted, fontSize: 36, fontWeight: "800" },
  field: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    width: 70,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
    color: c.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    padding: 8,
  },
  largeInput: {
    flex: 1,
    width: undefined,
    minWidth: 50,
    minHeight: 90,
    fontSize: 40,
    backgroundColor: c.soft,
  },
  presets: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  preset: {
    flex: 1,
    minWidth: 52,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
    padding: 9,
  },
  selectedPreset: { backgroundColor: c.brand },
  presetText: { color: c.brand, fontSize: 15, fontWeight: "700" },
  setting: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  summary: { backgroundColor: c.brand, padding: 24, borderRadius: 24, gap: 8 },
  summaryTitle: { color: "#C8D0FF", fontSize: 14, fontWeight: "700" },
  total: {
    color: "white",
    fontWeight: "800",
    fontSize: 34,
    fontVariant: ["tabular-nums"],
  },
  summaryCopy: { color: "#E1E6FF", fontSize: 14, lineHeight: 22 },
  error: { color: "#AE3B36", fontSize: 15, lineHeight: 23 },
});
