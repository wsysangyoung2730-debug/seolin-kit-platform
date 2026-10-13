import { Tabs } from "expo-router";
import { Icon, c } from "../../src/components/ui";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarLabelStyle: { fontWeight: "700" },
      }}
    >
      {[
        { name: "index", title: "홈", icon: "home" },
        { name: "explore", title: "미니앱", icon: "grid" },
        { name: "library", title: "내 앱", icon: "heart" },
        { name: "profile", title: "마이", icon: "user" },
      ].map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
