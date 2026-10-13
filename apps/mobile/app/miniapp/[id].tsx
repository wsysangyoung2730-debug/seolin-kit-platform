import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  AppIcon,
  AppRow,
  Back,
  Button,
  Card,
  Copy,
  Page,
  Title,
  c,
  s,
} from "../../src/components/ui";
import { catalog } from "../../src/data/catalog";
import { useLibrary } from "../../src/state/library";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = catalog.find((a) => a.id === id);
  const { ids, ready, error, toggle } = useLibrary();
  if (!app)
    return (
      <Page>
        <Back title="미니앱" />
        <Title>미니앱을 찾지 못했어요</Title>
        <Button label="목록으로" onPress={() => router.replace("/explore")} />
      </Page>
    );
  return (
    <Page
      footer={
        <Button
          label={
            app.status === "available" ? "무료로 시작하기" : "공개 준비 중"
          }
          disabled={app.status !== "available"}
          onPress={() => router.push("/ox")}
        />
      }
    >
      <Back title="미니앱 정보" />
      <View style={s.row}>
        <AppIcon id={app.id} size={88} />
        <View style={{ flex: 1, gap: 8 }}>
          <Title>{app.name}</Title>
          <Text style={s.badge}>
            {app.status === "available" ? "무료로 이용 가능" : "공개 준비 중"}
          </Text>
        </View>
      </View>
      <Copy>{app.summary}</Copy>
      <Button
        label={
          ids.includes(app.id) ? "♥ 내 앱에 담았어요 · 해제" : "♡ 내 앱에 추가"
        }
        secondary
        disabled={!ready}
        onPress={() => void toggle(app.id)}
      />
      {!!error && <Copy>{error}</Copy>}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={s.small}>제작</Text>
            <Text style={s.heading}>서린태권도</Text>
          </View>
          <View>
            <Text style={s.small}>카테고리</Text>
            <Text style={s.heading}>
              {app.category === "education" ? "교육" : "게임"}
            </Text>
          </View>
          <View>
            <Text style={s.small}>이용 요금</Text>
            <Text style={s.heading}>
              {app.access === "free" ? "무료" : "미정"}
            </Text>
          </View>
        </View>
      </Card>
      {app.id === "ox" && (
        <Card style={{ backgroundColor: c.brand, padding: 26 }}>
          <Text style={{ color: "#CAD1FF", fontWeight: "700" }}>
            수업 화면 미리보기
          </Text>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
            태권도는 올림픽 종목이다.
          </Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <Text style={{ color: "white", fontSize: 80, fontWeight: "900" }}>
              O
            </Text>
            <Text style={{ color: c.coral, fontSize: 80, fontWeight: "900" }}>
              X
            </Text>
          </View>
          <Text style={{ color: "#CAD1FF" }}>
            예시 문제 · TV 미러링으로 함께해요
          </Text>
        </Card>
      )}
      <Text style={s.section}>이 미니앱은요</Text>
      <Copy>{app.description}</Copy>
      {app.id === "ox" && (
        <Card>
          <Text style={s.heading}>이렇게 수업해요</Text>
          <Copy>
            1. 우리 수업에 맞게 문제를 준비해요. 2. 휴대폰·태블릿을 TV에
            미러링해요. 3. 제한 시간 안에 O 또는 X로 이동해요. 4. 정답을
            공개하고 함께 이야기해요.
          </Copy>
        </Card>
      )}
      <View style={s.row}>
        <Text style={s.section}>사용 후기</Text>
        <Text style={s.small}>0</Text>
      </View>
      <Card>
        <Text style={s.heading}>아직 등록된 후기가 없어요</Text>
        <Copy>
          후기 작성 기능은 준비 중이에요. 선생님들의 수업 경험을 나눌 수 있도록
          만들게요.
        </Copy>
      </Card>
      <Text style={s.section}>함께 살펴보세요</Text>
      {catalog
        .filter((a) => a.id !== app.id)
        .slice(0, 2)
        .map((a) => (
          <AppRow key={a.id} app={a} />
        ))}
    </Page>
  );
}
