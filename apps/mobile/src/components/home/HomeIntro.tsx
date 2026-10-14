import { useCallback, useRef, type PropsWithChildren } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Text,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { homeContent } from "../../data/home";
import { c } from "../ui";
export default function HomeIntro({ children }: PropsWithChildren) {
  const { width, fontScale } = useWindowDimensions();
  const intro = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;
  useFocusEffect(
    useCallback(() => {
      let disposed = false;
      let animation: Animated.CompositeAnimation | undefined;
      const show = () => {
        animation?.stop();
        intro.setValue(1);
        content.setValue(1);
      };
      intro.setValue(0);
      content.setValue(0);
      const subscription = AccessibilityInfo.addEventListener(
        "reduceMotionChanged",
        (reduce) => {
          if (reduce) show();
        },
      );
      void AccessibilityInfo.isReduceMotionEnabled()
        .then((reduce) => {
          if (disposed) return;
          if (reduce) return show();
          animation = Animated.stagger(
            100,
            [intro, content].map((value) =>
              Animated.timing(value, {
                toValue: 1,
                duration: 420,
                useNativeDriver: Platform.OS !== "web",
              }),
            ),
          );
          animation.start();
        })
        .catch(() => {
          if (!disposed) show();
        });
      return () => {
        disposed = true;
        subscription.remove();
        show();
      };
    }, [intro, content]),
  );
  const enter = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  });
  return (
    <>
      <Animated.View style={[{ gap: 6, paddingTop: 8 }, enter(intro)]}>
        <Text
          style={{
            color: "#7782AD",
            fontWeight: "700",
            fontSize: width >= 600 ? 20 : 16,
          }}
        >
          {homeContent.eyebrow}
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            color: c.brandStrong,
            fontWeight: "900",
            letterSpacing: -1,
            fontSize:
              fontScale > 1.25
                ? 28
                : Math.min(
                    40,
                    Math.max(26, (Math.min(width, 760) - 44) / 13.8),
                  ),
          }}
        >
          {homeContent.heading}
        </Text>
      </Animated.View>
      <Animated.View style={[{ gap: 18 }, enter(content)]}>
        {children}
      </Animated.View>
    </>
  );
}
