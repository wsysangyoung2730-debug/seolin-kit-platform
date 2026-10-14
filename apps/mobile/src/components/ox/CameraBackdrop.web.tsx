import { useEffect, useRef } from "react";
import type { CameraBackdropProps } from "./CameraBackdrop";

export default function CameraBackdrop({
  facing,
  mirrored,
  onStatus,
}: CameraBackdropProps) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    onStatus("카메라를 준비하고 있어요…");
    async function connect() {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("unavailable");
        const opened = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: facing === "front" ? "user" : "environment" },
        });
        // A permission dialog may resolve after this screen has closed.
        if (cancelled) {
          opened.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = opened;
        if (video.current) {
          video.current.srcObject = opened;
          await video.current.play();
        }
        if (!cancelled) onStatus("실시간 카메라 · 저장·전송하지 않아요");
      } catch (error) {
        stream?.getTracks().forEach((track) => track.stop());
        if (!cancelled)
          onStatus(
            error instanceof DOMException && error.name === "NotAllowedError"
              ? "카메라 권한이 꺼져 있어요. 브라우저에서 허용하거나 카메라 없이 진행해 주세요."
              : "카메라를 연결하지 못했어요. 카메라 없이도 진행할 수 있어요.",
          );
      }
    }
    void connect();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facing, onStatus]);
  return (
    <video
      ref={video}
      autoPlay
      playsInline
      muted
      aria-label="실시간 수업 카메라"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: mirrored ? "scaleX(-1)" : undefined,
      }}
    />
  );
}
