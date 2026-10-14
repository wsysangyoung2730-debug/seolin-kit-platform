import { useEffect, useState } from "react";
import { Camera, CameraView, type CameraType } from "expo-camera";
import { StyleSheet } from "react-native";

export type CameraBackdropProps = {
  facing: CameraType;
  mirrored: boolean;
  onStatus: (message: string) => void;
};

/** Mount only while the lesson is visible and the teacher has enabled the camera. */
export default function CameraBackdrop({
  facing,
  mirrored,
  onStatus,
}: CameraBackdropProps) {
  const [granted, setGranted] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    onStatus("카메라를 준비하고 있어요…");
    void Camera.requestCameraPermissionsAsync()
      .then((permission) => {
        if (cancelled) return;
        setGranted(permission.granted);
        if (!permission.granted)
          onStatus(
            "카메라 권한이 꺼져 있어요. 기기 설정에서 허용하거나 카메라 없이 진행해 주세요.",
          );
      })
      .catch(() => {
        if (!cancelled)
          onStatus(
            "카메라를 연결하지 못했어요. 카메라 없이도 진행할 수 있어요.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [onStatus]);
  useEffect(() => {
    setFailed(false);
  }, [facing]);
  if (!granted || failed) return null;
  return (
    <CameraView
      key={facing}
      facing={facing}
      mirror={false}
      mute
      style={[
        StyleSheet.absoluteFill,
        { transform: [{ scaleX: mirrored ? -1 : 1 }] },
      ]}
      onCameraReady={() => onStatus("실시간 카메라 · 저장·전송하지 않아요")}
      onMountError={() => {
        setFailed(true);
        onStatus(
          "카메라를 열지 못했어요. 다른 앱의 카메라를 끈 뒤 다시 켜 주세요.",
        );
      }}
    />
  );
}
