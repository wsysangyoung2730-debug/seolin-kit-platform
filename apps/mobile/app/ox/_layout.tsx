import { Stack } from "expo-router";
import { LessonProvider } from "../../src/state/lesson";
export default function OxLayout() {
  return (
    <LessonProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
    </LessonProvider>
  );
}
