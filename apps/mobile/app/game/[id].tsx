import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Orientation from "expo-screen-orientation";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
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
import { catalog } from "../../src/data/catalog";
import { getGameSource } from "../../src/components/live/games";
import GameCanvas from "../../src/components/live/GameCanvas";
import { buildGameDocument } from "../../src/components/live/document";
import {
  decodeGameStorage,
  type BridgeMessage,
} from "../../src/components/live/protocol";
import { prepareDevices } from "../../src/components/live/permissions";
const STORAGE = "seolin-live-games-v1";
export default function LiveGame() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = catalog.find((item) => item.id === id),
    source = getGameSource(id);
  const [camera, setCamera] = useState(id !== "memory"),
    [voice, setVoice] = useState(false);
  const [session, setSession] = useState<{
    html: string;
    voice: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [exitOpen, setExitOpen] = useState(false);
  const currentSession = useRef(false),
    externalActivity = useRef(false),
    mounted = useRef(true);
  const writes = useRef(Promise.resolve());
  const requestExit = useCallback(() => setExitOpen(true), []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useFocusEffect(
    useCallback(() => {
      const sub = AppState.addEventListener("change", (state) => {
        if (
          state === "background" &&
          currentSession.current &&
          !externalActivity.current
        ) {
          currentSession.current = false;
          setSession(null);
          setExitOpen(false);
          setNotice(
            "앱을 벗어나 카메라·음성을 종료했어요. 설정과 점수는 유지되며 게임은 새로 시작해요.",
          );
        }
      });
      const back =
        Platform.OS === "android"
          ? BackHandler.addEventListener("hardwareBackPress", () => {
              if (!currentSession.current) return false;
              requestExit();
              return true;
            })
          : undefined;
      return () => {
        sub.remove();
        back?.remove();
        currentSession.current = false;
        setSession(null);
      };
    }, [requestExit]),
  );
  useEffect(() => {
    if (!session) return;
    let disposed = false;
    const orientation =
      Platform.OS !== "web"
        ? Orientation.lockAsync(Orientation.OrientationLock.LANDSCAPE).catch(
            () => {},
          )
        : Promise.resolve();
    void activateKeepAwakeAsync("live-game")
      .then(() => {
        if (disposed) void deactivateKeepAwake("live-game").catch(() => {});
      })
      .catch(() => {});
    return () => {
      disposed = true;
      void deactivateKeepAwake("live-game").catch(() => {});
      void orientation
        .then(() =>
          Platform.OS !== "web" ? Orientation.unlockAsync() : undefined,
        )
        .catch(() => {});
    };
  }, [session]);
  async function open() {
    if (!source || busy) return;
    setBusy(true);
    setNotice("");
    try {
      await writes.current;
      const storage = decodeGameStorage(await AsyncStorage.getItem(STORAGE));
      const devices = await prepareDevices(camera, voice);
      if (!mounted.current) return;
      setNotice(devices.note);
      currentSession.current = true;
      setSession({
        html: buildGameDocument(source, {
          native: Platform.OS !== "web",
          camera: devices.camera,
          voice: devices.voice,
          storage,
        }),
        voice: devices.voice,
      });
    } catch {
      setNotice(
        "저장 데이터를 읽지 못했어요. 기존 데이터를 보존했으니 다시 시도해 주세요.",
      );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const receive = useCallback(
    (message: BridgeMessage) => {
      if (message.type === "exit") requestExit();
      if (message.type === "storage") {
        const raw = JSON.stringify(message.data);
        // Serialize writes so a slow older save never overwrites the latest scores.
        writes.current = writes.current
          .then(() => AsyncStorage.setItem(STORAGE, raw))
          .catch(() => {
            if (mounted.current)
              setNotice(
                "점수·설정을 저장하지 못했어요. 앱을 닫기 전에 확인해 주세요.",
              );
          });
      }
    },
    [requestExit],
  );
  const error = useCallback((message: string) => setNotice(message), []);
  const external = useCallback((value: boolean) => {
    externalActivity.current = value;
  }, []);
  if (!app || !source)
    return (
      <Page>
        <Back title="미니앱" />
        <Title>공개 준비 중이에요</Title>
        <Copy>이 게임의 앱 연결을 준비하고 있어요.</Copy>
      </Page>
    );
  if (!session)
    return (
      <Page
        footer={
          <Button
            label={busy ? "연결하는 중…" : "게임 열기"}
            disabled={busy}
            onPress={() => void open()}
          />
        }
      >
        <Back title={app.name} />
        <View style={s.row}>
          <AppIcon id={app.id} size={72} />
          <View style={{ flex: 1 }}>
            <Title>{app.name}</Title>
            <Text style={s.small}>서린툴 · 수업 준비</Text>
          </View>
        </View>
        <Copy>{app.description}</Copy>
        <Card>
          <Text style={s.heading}>기기 연결</Text>
          {id !== "memory" && (
            <View style={[s.row, { justifyContent: "space-between" }]}>
              <Copy>실시간 카메라</Copy>
              <Switch
                accessibilityLabel="실시간 카메라"
                value={camera}
                onValueChange={setCamera}
                disabled={busy}
              />
            </View>
          )}
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Copy>음성 명령·답변 인식</Copy>
            <Switch
              accessibilityLabel="음성 명령·답변 인식"
              value={voice}
              onValueChange={setVoice}
              disabled={busy}
            />
          </View>
          <Text style={s.small}>
            카메라 영상은 저장·전송하지 않아요. 음성 인식은 기기의 음성
            서비스에서 처리하며 인터넷 연결이 필요할 수 있어요. 꺼두면 버튼과
            직접 입력으로 진행할 수 있어요.
          </Text>
          {(id === "freeze" || id === "breaking") && (
            <Text style={s.small}>
              움직임 감지에는 카메라가 필요해요. 조명과 기기 위치를 먼저 확인해
              주세요.
            </Text>
          )}
        </Card>
        <Card>
          <Text style={s.heading}>수업 중에는</Text>
          <Copy>
            게임 안의 설정과 팀 점수판을 사용할 수 있어요. 가로 화면으로 TV에
            미러링해 주세요.
          </Copy>
          <Text style={s.small}>
            앱을 벗어나면 카메라와 음성을 끄고 수업을 종료해요. 점수와 저장
            가능한 설정은 유지하지만 진행 중인 라운드와 선택한 사진은 다시
            준비해야 해요.
          </Text>
        </Card>
        {!!notice && <Copy>{notice}</Copy>}
      </Page>
    );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.stage }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          minHeight: 44,
        }}
      >
        <Text style={{ color: "white", fontWeight: "800" }}>
          서린툴 · {app.name}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={requestExit}
          style={{ minHeight: 44, padding: 12 }}
        >
          <Text style={{ color: "white" }}>수업 종료</Text>
        </Pressable>
      </View>
      {!!notice && (
        <Text
          accessibilityRole="alert"
          style={{ color: "#FFDA67", padding: 10 }}
        >
          {notice}
        </Text>
      )}
      <GameCanvas
        html={session.html}
        voice={session.voice}
        onMessage={receive}
        onError={error}
        onExternalActivity={external}
      />
      <Modal
        visible={exitOpen}
        transparent
        onRequestClose={() => setExitOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#0009",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Card style={{ maxWidth: 440, width: "100%", alignSelf: "center" }}>
            <Title>수업을 종료할까요?</Title>
            <Copy>
              현재 라운드와 선택한 사진은 초기화돼요. 저장된 팀 점수와 설정은
              유지돼요. 안내창이 열린 동안 게임은 계속 진행돼요.
            </Copy>
            <Button
              label="종료하고 준비 화면으로"
              onPress={() => {
                currentSession.current = false;
                setSession(null);
                setExitOpen(false);
              }}
            />
            <Button
              secondary
              label="계속 진행"
              onPress={() => setExitOpen(false)}
            />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
