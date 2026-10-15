import { useEffect, useRef, useState } from "react";
import { AppState, Button, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  decodeState,
  injectInitialState,
  STORAGE_KEY,
} from "../../../../../miniapps/pinball/src/state";

export default function PinballView({ onExit }: { onExit: () => void }) {
  const web = useRef<WebView>(null),
    alive = useRef(true),
    writes = useRef(Promise.resolve());
  const [html, setHtml] = useState(""),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    void (async () => {
      try {
        await writes.current;
        const [asset, raw] = await Promise.all([
          Asset.fromModule(
            require("../../../../../miniapps/pinball/generated/pinball.html"),
          ).downloadAsync(),
          AsyncStorage.getItem(STORAGE_KEY),
        ]);
        let stored: unknown = null;
        try {
          stored = raw === null ? null : JSON.parse(raw);
        } catch {
          stored = "corrupted";
        }
        const source = await new File(asset.localUri ?? asset.uri).text();
        if (!cancelled)
          setHtml(injectInitialState(source, stored));
      } catch {
        if (!cancelled) setError("핀볼을 준비하지 못했어요. 다시 열어 주세요.");
      }
    })();
    return () => {
      cancelled = true;
      alive.current = false;
      web.current?.injectJavaScript("window.__pinballDispose?.();true;");
    };
  }, [attempt]);
  useFocusEffect(
    useCallback(() => {
      web.current?.injectJavaScript("window.__pinballPause?.(false);true;");
      const subscription = AppState.addEventListener("change", (state) =>
        web.current?.injectJavaScript(
          `window.__pinballPause?.(${state !== "active"});true;`,
        ),
      );
      return () => {
        subscription.remove();
        web.current?.injectJavaScript("window.__pinballPause?.(true);true;");
      };
    }, []),
  );
  function receive(raw: string) {
    if (!alive.current || raw.length > 50000) return;
    try {
      const message = JSON.parse(raw) as {
        version?: number;
        type?: string;
        state?: unknown;
      };
      if (message.version !== 1) return;
      if (message.type === "pinball-exit") onExit();
      if (message.type === "pinball-save") {
        const value = JSON.stringify(
          decodeState(JSON.stringify(message.state)),
        );
        writes.current = writes.current
          .then(() => AsyncStorage.setItem(STORAGE_KEY, value))
          .catch(() => {
            if (alive.current)
              setError(
                "기록을 저장하지 못했어요. 다시 열어 저장 상태를 확인해 주세요.",
              );
          });
      }
    } catch {
      /* Reject invalid bridge data without altering saved records. */
    }
  }
  if (error)
    return (
      <View
        style={{ flex: 1, justifyContent: "center", padding: 24, gap: 20 }}
        accessibilityRole="alert"
      >
        <Text>{error}</Text>
        <Button
          title="다시 불러오기"
          onPress={() => {
            setError("");
            setHtml("");
            setAttempt((x) => x + 1);
          }}
        />
        <Button title="목록으로" onPress={onExit} />
      </View>
    );
  if (!html)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>띠 핀볼을 준비하고 있어요…</Text>
      </View>
    );
  return (
    <WebView
      ref={web}
      source={{ html, baseUrl: "https://seolin-tool.local/" }}
      style={{ flex: 1, backgroundColor: "#f8f3e9" }}
      originWhitelist={["https://seolin-tool.local", "about:blank"]}
      javaScriptCanOpenWindowsAutomatically={false}
      setSupportMultipleWindows={false}
      allowFileAccess={false}
      allowUniversalAccessFromFileURLs={false}
      mixedContentMode="never"
      allowsInlineMediaPlayback
      onShouldStartLoadWithRequest={(request) =>
        request.url === "about:blank" ||
        request.url === "https://seolin-tool.local/"
      }
      onMessage={(event) => receive(event.nativeEvent.data)}
      onError={() => setError("3D 화면을 열지 못했어요. 다시 불러와 주세요.")}
      onContentProcessDidTerminate={() =>
        setError("3D 화면이 종료됐어요. 다시 불러와 주세요.")
      }
      onRenderProcessGone={() =>
        setError("3D 화면이 종료됐어요. 다시 불러와 주세요.")
      }
    />
  );
}
