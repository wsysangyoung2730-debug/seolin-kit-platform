import { useEffect, useRef } from "react";
import { WebView } from "react-native-webview";
import * as Speech from "expo-speech";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import type { ExpoSpeechRecognitionModuleType } from "expo-speech-recognition/build/ExpoSpeechRecognitionModule.types";
import { parseBridgeMessage } from "./protocol";
import type { GameCanvasProps } from "./types";

export default function GameCanvas({
  html,
  voice,
  onMessage,
  onError,
  onExternalActivity,
}: GameCanvasProps) {
  const web = useRef<WebView>(null);
  const alive = useRef(true);
  const speechReady = useRef<Promise<ExpoSpeechRecognitionModuleType> | null>(
    null,
  );
  const speechRunning = useRef(false);
  const fileBusy = useRef(false);
  const callbacks = useRef({ onMessage, onError, onExternalActivity });
  callbacks.current = { onMessage, onError, onExternalActivity };
  function inject(fn: string, ...args: unknown[]) {
    if (alive.current)
      web.current?.injectJavaScript(
        `window.${fn}?.(${args.map((value) => JSON.stringify(value).replace(/</g, "\\u003c")).join(",")});true;`,
      );
  }
  useEffect(() => {
    alive.current = true;
    let disposed = false;
    let module: ExpoSpeechRecognitionModuleType | undefined;
    const subscriptions: { remove: () => void }[] = [];
    if (voice)
      speechReady.current = import("expo-speech-recognition").then(
        ({ ExpoSpeechRecognitionModule: speech }) => {
          module = speech;
          if (disposed) return speech;
          subscriptions.push(
            speech.addListener("start", () =>
              inject("__seolinSpeech", "start", {}),
            ),
            speech.addListener("result", (event) =>
              inject("__seolinSpeech", "result", {
                text: event.results[0]?.transcript || "",
                final: event.isFinal,
              }),
            ),
            speech.addListener("error", (event) =>
              inject("__seolinSpeech", "error", { error: event.error }),
            ),
            speech.addListener("end", () => {
              speechRunning.current = false;
              inject("__seolinSpeech", "end", {});
            }),
          );
          return speech;
        },
      );
    return () => {
      disposed = true;
      const closingView = web.current;
      alive.current = false;
      subscriptions.forEach((subscription) => subscription.remove());
      // React development mode may immediately re-run this effect without removing the view.
      queueMicrotask(() => {
        if (alive.current) return;
        closingView?.injectJavaScript("window.__seolinDispose?.();true;");
        module?.abort();
        void Speech.stop();
      });
    };
  }, [voice]);
  async function receive(raw: string) {
    const message = parseBridgeMessage(raw);
    if (!message || !alive.current) return;
    if (message.type === "speech-start") {
      if (!voice || speechRunning.current || !speechReady.current) return;
      speechRunning.current = true;
      try {
        const speech = await speechReady.current;
        if (!alive.current) return;
        speech.start({ lang: "ko-KR", interimResults: true, continuous: true });
      } catch {
        speechRunning.current = false;
        inject("__seolinSpeech", "error", { error: "service-not-allowed" });
        inject("__seolinSpeech", "end", {});
        callbacks.current.onError(
          "음성 인식을 사용할 수 없어요. 직접 입력으로 진행해 주세요.",
        );
      }
    } else if (message.type === "speech-stop") {
      const speech = await speechReady.current?.catch(() => null);
      if (alive.current) speech?.stop();
    } else if (message.type === "tts") {
      Speech.speak(message.text, {
        language: "ko-KR",
        rate: message.rate,
        pitch: message.pitch,
      });
    } else if (message.type === "tts-stop") {
      void Speech.stop();
    } else if (message.type === "files") {
      if (fileBusy.current) return;
      fileBusy.current = true;
      callbacks.current.onExternalActivity(true);
      try {
        const picked = await DocumentPicker.getDocumentAsync({
          type: message.accept.includes("image") ? "image/*" : "text/plain",
          multiple: message.multiple,
          copyToCacheDirectory: true,
        });
        if (!alive.current || picked.canceled) return;
        if (
          picked.assets.reduce(
            (total, asset) => total + (asset.size ?? new File(asset.uri).size),
            0,
          ) >
          50 * 1024 * 1024
        )
          throw new Error("사진은 한 번에 50MB 이하로 선택해 주세요.");
        const files = [];
        for (const asset of picked.assets) {
          files.push({
            name: asset.name,
            type: asset.mimeType || "application/octet-stream",
            data: await new File(asset.uri).base64(),
          });
        }
        inject("__seolinFiles", message.id, files);
      } catch (error) {
        if (alive.current)
          callbacks.current.onError(
            error instanceof Error
              ? error.message
              : "사진을 불러오지 못했어요.",
          );
      } finally {
        fileBusy.current = false;
        callbacks.current.onExternalActivity(false);
      }
    } else callbacks.current.onMessage(message);
  }
  return (
    <WebView
      ref={web}
      source={{ html, baseUrl: "https://seolin-tool.local/" }}
      style={{ flex: 1, backgroundColor: "#101B3B" }}
      originWhitelist={["*"]}
      onShouldStartLoadWithRequest={(request) =>
        request.url === "about:blank" ||
        request.url === "https://seolin-tool.local/" ||
        request.url.startsWith("https://seolin-tool.local/#")
      }
      javaScriptCanOpenWindowsAutomatically={false}
      setSupportMultipleWindows={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      mediaCapturePermissionGrantType="grantIfSameHostElseDeny"
      allowFileAccess={false}
      allowUniversalAccessFromFileURLs={false}
      mixedContentMode="never"
      onMessage={(event) => void receive(event.nativeEvent.data)}
      onError={() =>
        callbacks.current.onError(
          "게임 화면을 열지 못했어요. 나갔다 다시 열어 주세요.",
        )
      }
      onContentProcessDidTerminate={() =>
        callbacks.current.onError(
          "게임 화면이 종료됐어요. 나갔다 다시 열어 주세요.",
        )
      }
      onRenderProcessGone={() =>
        callbacks.current.onError(
          "게임 화면이 종료됐어요. 나갔다 다시 열어 주세요.",
        )
      }
    />
  );
}
