import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  AppRow,
  Button,
  Card,
  Copy,
  Icon,
  Page,
  Title,
  c,
  s,
} from "../../src/components/ui";
import { catalog, categories } from "../../src/data/catalog";
export default function Home() {
  return (
    <Page>
      <View style={s.row}>
        <Image
          source={require("../../assets/seolin-kit-icon.png")}
          style={{ width: 44, height: 44, borderRadius: 13 }}
        />
        <View>
          <Text style={{ color: c.brand, fontWeight: "900", fontSize: 23 }}>
            서린킷
          </Text>
          <Text style={s.small}>수업에 필요한 모든 가능성</Text>
        </View>
      </View>
      <Card style={{ backgroundColor: c.brand, borderWidth: 0, padding: 25 }}>
        <Text style={{ color: "#C6CDFF", fontSize: 12, fontWeight: "800" }}>
          TODAY’S CLASS
        </Text>
        <Text
          style={{
            color: "white",
            fontWeight: "800",
            fontSize: 29,
            lineHeight: 40,
          }}
        >
          오늘 수업, 함께 즐길 준비 됐나요?
        </Text>
        <Text style={{ color: "#DFE3FF", lineHeight: 23 }}>
          우리 수업에 꼭 맞는 도구를 꺼내 보세요.
        </Text>
        <Button
          secondary
          label="O/X 수업 준비하기 →"
          onPress={() => router.push("/ox")}
        />
      </Card>
      <View style={[s.row, { justifyContent: "space-between", gap: 4 }]}>
        {categories.slice(1).map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() =>
              router.push({
                pathname: "/explore",
                params: { category: item.id },
              })
            }
            style={{
              alignItems: "center",
              gap: 10,
              paddingVertical: 6,
              flex: 1,
            }}
          >
            <View
              style={{ backgroundColor: c.soft, padding: 17, borderRadius: 20 }}
            >
              <Icon name={item.icon} size={26} />
            </View>
            <Text style={s.small}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Text style={s.section}>수업 추천 미니앱</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/explore")}
        >
          <Text style={s.small}>전체 보기 →</Text>
        </Pressable>
      </View>
      <Card>
        {catalog.slice(0, 2).map((app) => (
          <AppRow key={app.id} app={app} />
        ))}
      </Card>
      <Card>
        <Text style={s.heading}>곧 더 다양한 도구를 만나요</Text>
        <Copy>
          게임부터 교육, 편집까지. 새로운 미니앱을 차근차근 준비하고 있어요.
        </Copy>
      </Card>
    </Page>
  );
}
