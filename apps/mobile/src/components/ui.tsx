import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { router } from "expo-router";
import type { PropsWithChildren, ReactNode } from "react";
import type { MiniApp } from "@seolin/contracts";
import { colors as c } from "@seolin/design-tokens";
export { c };
export function Icon({
  name,
  size = 24,
  color = c.brand,
}: {
  name: string;
  size?: number;
  color?: ColorValue;
}) {
  const paths: Record<string, string> = {
    home: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9",
    book: "M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 6v15",
    edit: "m4 16 12-12 4 4L8 20H4zM14 6l4 4",
    kit: "M8 7V3h8v4M3 8h18v13H3zM3 12h18M10 12v3h4v-3",
    game: "M7 7h10l4 11-3 2-4-4h-4l-4 4-3-2zM6 11h6M9 8v6M16 10h.01M18 13h.01",
    heart: "M12 20S2 14 2 8a5 5 0 0 1 10-1A5 5 0 0 1 22 8c0 6-10 12-10 12Z",
    back: "m15 4-8 8 8 8",
    user: "M4 22v-3a8 8 0 0 1 16 0v3M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
    search: "M16 16l5 5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14",
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "grid" ? (
        <>
          <Rect x={3} y={3} width={7} height={7} rx={2} />
          <Rect x={14} y={3} width={7} height={7} rx={2} />
          <Rect x={3} y={14} width={7} height={7} rx={2} />
          <Rect x={14} y={14} width={7} height={7} rx={2} />
        </>
      ) : (
        <Path d={paths[name] ?? paths.kit} />
      )}
    </Svg>
  );
}
export function Page({
  children,
  footer,
}: PropsWithChildren<{ footer?: ReactNode }>) {
  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={s.page}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer && (
        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderColor: c.border,
            backgroundColor: c.surface,
          }}
        >
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}
export function Title({ children }: PropsWithChildren) {
  return <Text style={s.title}>{children}</Text>;
}
export function Copy({ children }: PropsWithChildren) {
  return <Text style={s.copy}>{children}</Text>;
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: c.brand }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Back({ title }: { title: string }) {
  return (
    <View style={s.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
        style={s.iconButton}
      >
        <Icon name="back" />
      </Pressable>
      <Text style={s.heading}>{title}</Text>
    </View>
  );
}
const miniappImages: Record<string, number> = {
  breaking: require("../../assets/breaking-icon.png"),
  ox: require("../../assets/ox-icon.png"),
};
export function AppIcon({ id, size = 64 }: { id: string; size?: number }) {
  return miniappImages[id] ? (
    <Image
      source={miniappImages[id]}
      style={{ width: size, height: size, borderRadius: size * 0.24 }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        backgroundColor: c.soft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name="game" size={size * 0.5} />
    </View>
  );
}
export function AppRow({ app }: { app: MiniApp }) {
  return (
    <View style={[s.row, { paddingVertical: 12 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${app.name} 상세 정보`}
        onPress={() =>
          router.push({ pathname: "/miniapp/[id]", params: { id: app.id } })
        }
        style={[s.row, { flex: 1 }]}
      >
        <AppIcon id={app.id} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.heading}>{app.name}</Text>
          <Text style={s.small}>{app.summary}</Text>
          <Text style={s.badge}>
            {app.status === "available" ? "무료" : "준비 중 · 요금 미정"}
          </Text>
        </View>
      </Pressable>
      {app.status === "available" && (
        <Button
          label="시작"
          secondary
          onPress={() =>
            router.push(
              app.id === "ox"
                ? "/ox"
                : { pathname: "/game/[id]", params: { id: app.id } },
            )
          }
        />
      )}
    </View>
  );
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 22,
    paddingBottom: 36,
    gap: 22,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: c.text,
    letterSpacing: -0.8,
  },
  heading: { fontSize: 18, fontWeight: "700", color: c.text },
  copy: { fontSize: 16, lineHeight: 25, color: c.muted },
  small: { fontSize: 13, lineHeight: 20, color: c.muted },
  card: {
    backgroundColor: c.surface,
    borderRadius: 22,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  button: {
    minHeight: 48,
    backgroundColor: c.brand,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { backgroundColor: c.soft },
  buttonText: { color: "white", fontSize: 15, fontWeight: "700" },
  badge: { fontSize: 12, fontWeight: "700", color: c.positive },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    backgroundColor: "white",
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    color: c.text,
  },
  section: { fontSize: 20, fontWeight: "800", color: c.text },
  divider: { height: 1, backgroundColor: c.border },
});
