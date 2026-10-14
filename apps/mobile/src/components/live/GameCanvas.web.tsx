import { useEffect, useRef } from "react";
import type { GameCanvasProps } from "./types";
import { parseBridgeMessage } from "./protocol";
export default function GameCanvas({
  html,
  onMessage,
  onError,
}: GameCanvasProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const mounted = useRef(true);
  const callbacks = useRef({ onMessage, onError });
  callbacks.current = { onMessage, onError };
  useEffect(() => {
    mounted.current = true;
    const child = frame.current;
    const receive = (event: MessageEvent) => {
      if (
        event.source !== child?.contentWindow ||
        event.origin !== location.origin ||
        typeof event.data !== "string"
      )
        return;
      const message = parseBridgeMessage(event.data);
      if (message) callbacks.current.onMessage(message);
    };
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      const win = child?.contentWindow as
        (Window & { __seolinDispose?: () => void }) | null;
      mounted.current = false;
      queueMicrotask(() => {
        if (!mounted.current) win?.__seolinDispose?.();
      });
    };
  }, []);
  return (
    <iframe
      ref={frame}
      srcDoc={html}
      title="서린툴 미니앱 수업 화면"
      allow="camera; microphone; fullscreen; autoplay"
      allowFullScreen
      style={{
        width: "100%",
        height: "100%",
        flex: 1,
        border: 0,
        background: "#101B3B",
      }}
      onError={() => callbacks.current.onError("게임 화면을 열지 못했어요.")}
    />
  );
}
