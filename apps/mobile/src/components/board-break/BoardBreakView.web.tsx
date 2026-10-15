import { useEffect, useRef, useState } from "react";
import { Button, Text, View } from "react-native";

export default function BoardBreakView({ onExit }: { onExit: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  const callbacks = useRef(onExit);
  callbacks.current = onExit;
  useEffect(() => {
    const child = frame.current;
    const timeout = setTimeout(() => setError(true), 25000);
    const receive = (event: MessageEvent) => {
      if (
        event.source !== child?.contentWindow ||
        event.origin !== location.origin ||
        typeof event.data !== "string"
      )
        return;
      try {
        const message = JSON.parse(event.data) as {
          version?: number;
          type?: string;
        };
        if (message.version !== 1) return;
        if (message.type === "breaking-ready") {
          clearTimeout(timeout);
          setError(false);
        }
        if (message.type === "breaking-exit") callbacks.current();
      } catch {
        /* Ignore unrelated messages. */
      }
    };
    window.addEventListener("message", receive);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", receive);
      child?.contentWindow?.postMessage(
        JSON.stringify({ type: "breaking-dispose" }),
        location.origin,
      );
    };
  }, [attempt]);
  return (
    <View style={{ flex: 1 }}>
      <iframe
        key={attempt}
        ref={frame}
        src="/board-break/index.html"
        title="격파 한 판 3D 미니앱"
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{
          width: "100%",
          height: "100%",
          flex: 1,
          border: 0,
          background: "#f8f3e9",
        }}
        onError={() => setError(true)}
      />
      {error && (
        <View
          accessibilityRole="alert"
          style={{
            position: "absolute",
            inset: 24,
            backgroundColor: "#fffaf1",
            justifyContent: "center",
            padding: 24,
            gap: 16,
          }}
        >
          <Text>격파 화면을 열지 못했어요. 다시 불러와 주세요.</Text>
          <Button
            title="다시 불러오기"
            onPress={() => {
              setError(false);
              setAttempt((x) => x + 1);
            }}
          />
          <Button title="목록으로" onPress={onExit} />
        </View>
      )}
    </View>
  );
}
