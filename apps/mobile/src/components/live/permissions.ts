import { Camera } from "expo-camera";
export async function prepareDevices(
  camera: boolean,
  voice: boolean,
  isCurrent = () => true,
) {
  const notes: string[] = [];
  if (camera && isCurrent()) {
    try {
      camera = (await Camera.requestCameraPermissionsAsync()).granted;
    } catch {
      camera = false;
    }
    if (!camera)
      notes.push(
        "카메라 권한을 허용하지 않았어요. 움직임 감지는 사용할 수 없어요.",
      );
  }
  if (voice && isCurrent()) {
    try {
      const { ExpoSpeechRecognitionModule: speech } =
        await import("expo-speech-recognition");
      if (!isCurrent()) return { camera: false, voice: false, note: "" };
      voice =
        (await speech.requestPermissionsAsync()).granted &&
        speech.isRecognitionAvailable();
    } catch {
      voice = false;
    }
    if (!voice)
      notes.push(
        "음성 인식을 연결하지 못했어요. 직접 입력으로 진행해 주세요. 네이티브 개발 빌드가 필요할 수 있어요.",
      );
  }
  return { camera, voice, note: notes.join(" ") };
}
