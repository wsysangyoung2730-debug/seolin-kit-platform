import { useCallback } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useKeepAwake } from "expo-keep-awake";
import PinballView from "../../src/components/pinball/PinballView";

export default function Pinball() {
  useKeepAwake();
  const exit = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f3e9" }}>
      <PinballView onExit={exit} />
    </SafeAreaView>
  );
}
