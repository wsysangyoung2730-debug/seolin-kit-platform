import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { AppRow, Card, Copy, Page, c, s } from "../../src/components/ui";
import { catalog } from "../../src/data/catalog";
import { getFeaturedApp } from "../../src/data/home";
import HomeIntro from "../../src/components/home/HomeIntro";
import FeaturedGame from "../../src/components/home/FeaturedGame";
import CategoryTiles from "../../src/components/home/CategoryTiles";
export default function Home() {
  const featured = getFeaturedApp(catalog);
  return (
    <Page>
      <View style={s.row}>
        <Image
          source={require("../../assets/seolin-kit-icon.png")}
          style={{ width: 40, height: 40, borderRadius: 12 }}
        />
        <Text style={{ color: c.brand, fontWeight: "900", fontSize: 23 }}>
          서린툴
        </Text>
      </View>
      <HomeIntro>
        {featured && <FeaturedGame app={featured} />}
        <CategoryTiles />
      </HomeIntro>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Text style={s.section}>수업 추천 미니앱</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/explore")}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={s.small}>전체 보기 →</Text>
        </Pressable>
      </View>
      <Card>
        {catalog
          .filter((app) => app.status === "available")
          .map((app) => (
            <AppRow key={app.id} app={app} />
          ))}
      </Card>
      <Card>
        <Text style={s.heading}>우리 수업에 맞게, 하나씩</Text>
        <Copy>
          게임부터 교육, 편집까지. 자주 쓰는 미니앱은 내 앱에 담아 빠르게 꺼내
          보세요.
        </Copy>
      </Card>
    </Page>
  );
}
