import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { router } from "expo-router";
import type { MiniApp } from "@seolin/contracts";
import { AppIcon, c } from "../ui";
import { homeContent } from "../../data/home";
import { categories } from "../../data/catalog";
export default function FeaturedGame({ app }: { app: MiniApp }) {
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 370,
    wide = width >= 600,
    largeText = fontScale > 1.25;
  const iconSize = compact ? 56 : wide ? 96 : 72;
  const artSize = compact ? 70 : wide ? 148 : 96;
  return (
    <View style={[styles.card, { padding: compact ? 16 : wide ? 28 : 20 }]}>
      <Svg
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 700 420"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#202D78" />
            <Stop offset="1" stopColor="#3445A1" />
          </LinearGradient>
        </Defs>
        <Rect width="700" height="420" fill="url(#hero)" />
        <Path d="M240 0H430L700 190V300Z" fill="white" opacity=".035" />
        <Path d="M430 0H570L700 95V190Z" fill="white" opacity=".055" />
      </Svg>
      <Text style={styles.badge}>오늘의 미니앱</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${app.name} 상세 정보`}
        onPress={() =>
          router.push({ pathname: "/miniapp/[id]", params: { id: app.id } })
        }
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: compact ? 12 : 16,
            paddingVertical: 20,
            minHeight: wide ? 176 : 140,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <AppIcon id={app.id} size={iconSize} />
        <View
          style={{
            flex: 1,
            gap: 7,
            zIndex: 1,
            paddingRight: wide && !largeText ? artSize - 4 : 0,
          }}
        >
          <Text style={styles.category}>
            {categories.find((item) => item.id === app.category)?.name}
          </Text>
          <Text
            style={{
              color: "white",
              fontWeight: "900",
              fontSize: wide ? 38 : compact ? 23 : 27,
              letterSpacing: -0.6,
            }}
          >
            {app.name}
          </Text>
          <Text
            style={{
              color: "#E3E7FF",
              fontSize: wide ? 19 : 14,
              lineHeight: wide ? 28 : 21,
            }}
          >
            {app.id === homeContent.featuredId
              ? homeContent.featuredDescription
              : app.summary}
          </Text>
        </View>
        {!largeText && (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: "absolute",
              right: 0,
              top: wide ? 22 : 46,
              width: artSize,
              height: artSize,
              opacity: wide ? 1 : 0.15,
            }}
          >
            {app.id === "ox" ? (
              <>
                <View
                  style={[
                    styles.artCard,
                    {
                      width: artSize * 0.7,
                      height: artSize * 0.7,
                      right: 0,
                      top: 0,
                      backgroundColor: "#5969D4",
                      transform: [{ rotate: "15deg" }],
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "900",
                      fontSize: artSize * 0.53,
                      color: "#FF928B",
                      lineHeight: artSize * 0.66,
                    }}
                  >
                    ×
                  </Text>
                </View>
                <View
                  style={[
                    styles.artCard,
                    {
                      width: artSize * 0.73,
                      height: artSize * 0.73,
                      left: 0,
                      bottom: 0,
                      backgroundColor: "#F0F2FF",
                      transform: [{ rotate: "-13deg" }],
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "900",
                      fontSize: artSize * 0.48,
                      color: "#5868D2",
                      lineHeight: artSize * 0.67,
                    }}
                  >
                    O
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ transform: [{ rotate: "12deg" }], opacity: 0.6 }}>
                <AppIcon id={app.id} size={artSize} />
              </View>
            )}
          </View>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${app.name} 게임 준비하기`}
        onPress={() =>
          router.push(
            app.id === "ox"
              ? "/ox"
              : { pathname: "/game/[id]", params: { id: app.id } },
          )
        }
        style={({ pressed }) => [styles.start, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            marginLeft: 22,
            color: c.brandStrong,
            fontWeight: "900",
            fontSize: wide ? 22 : 17,
          }}
        >
          게임 준비하기
        </Text>
        <Text style={{ color: c.brand, fontSize: 30 }}>→</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: c.brand,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4A59AD",
    boxShadow: "0 12px 28px rgba(32,45,120,0.12)",
  },
  badge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    color: c.brandStrong,
    backgroundColor: "#D8DFFF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 24,
    fontSize: 14,
    fontWeight: "800",
  },
  category: {
    alignSelf: "flex-start",
    color: "white",
    backgroundColor: "#FFFFFF24",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    overflow: "hidden",
    fontWeight: "700",
    fontSize: 12,
  },
  artCard: {
    position: "absolute",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF35",
    boxShadow: "0 8px 14px rgba(10,20,60,.22)",
  },
  start: {
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#F1F3FF",
  },
});
