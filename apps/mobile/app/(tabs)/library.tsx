import { Text } from "react-native";
import { router } from "expo-router";
import {
  AppRow,
  Button,
  Card,
  Copy,
  Page,
  Title,
} from "../../src/components/ui";
import { catalog } from "../../src/data/catalog";
import { useLibrary } from "../../src/state/library";
export default function Library() {
  const { ids, ready, error, reload } = useLibrary();
  return (
    <Page>
      <Title>내 앱</Title>
      <Copy>자주 쓰는 도구를 모아두세요.</Copy>
      {error && (
        <Card>
          <Copy>{error}</Copy>
          <Button label="다시 불러오기" onPress={reload} />
        </Card>
      )}
      {!ready && !error ? (
        <Copy>내 앱을 불러오는 중이에요.</Copy>
      ) : ids.length ? (
        <Card>
          {catalog
            .filter((app) => ids.includes(app.id))
            .map((app) => (
              <AppRow key={app.id} app={app} />
            ))}
        </Card>
      ) : (
        ready && (
          <Card>
            <Text style={{ fontSize: 30 }}>♡</Text>
            <Copy>
              아직 담아둔 미니앱이 없어요. 미니앱 상세 화면에서 내 앱에 추가해
              보세요.
            </Copy>
            <Button
              label="미니앱 둘러보기"
              onPress={() => router.push("/explore")}
            />
          </Card>
        )
      )}
      <Copy>현재 내 앱 목록은 이 기기에 저장돼요.</Copy>
    </Page>
  );
}
