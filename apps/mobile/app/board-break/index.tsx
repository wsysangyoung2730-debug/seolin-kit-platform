import { useCallback } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useKeepAwake } from "expo-keep-awake";
import BoardBreakView from "../../src/components/board-break/BoardBreakView";

export default function BoardBreak() {
  useKeepAwake();
  const exit = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f3e9" }}>
      <BoardBreakView onExit={exit} />
    </SafeAreaView>
  );
}
