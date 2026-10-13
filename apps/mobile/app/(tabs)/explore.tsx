import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { AppRow, Card, Copy, Page, Title, c, s } from "../../src/components/ui";
import { categories, filterCatalog } from "../../src/data/catalog";
export default function Explore() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [selected, setSelected] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const category = selected ?? params.category ?? "all";
  useEffect(() => setSelected(undefined), [params.category]);
  const results = filterCatalog(query, category);
  return (
    <Page>
      <Title>미니앱</Title>
      <Copy>수업에 필요한 도구를 찾아보세요.</Copy>
      <TextInput
        accessibilityLabel="미니앱 검색"
        placeholder="어떤 도구를 찾으세요?"
        placeholderTextColor={c.muted}
        value={query}
        onChangeText={setQuery}
        style={s.input}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {categories.map((item) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: category === item.id }}
            key={item.id}
            onPress={() => setSelected(item.id)}
            style={{
              backgroundColor: category === item.id ? c.brand : c.soft,
              borderRadius: 30,
              padding: 14,
            }}
          >
            <Text
              style={{
                color: category === item.id ? "white" : c.brand,
                fontWeight: "700",
              }}
            >
              {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={s.small}>{results.length}개의 미니앱</Text>
      <Card>
        {results.length ? (
          results.map((app) => <AppRow key={app.id} app={app} />)
        ) : (
          <Copy>
            {query
              ? "검색 결과가 없어요. 다른 단어로 찾아보세요."
              : "이 카테고리의 도구를 준비하고 있어요."}
          </Copy>
        )}
      </Card>
      <Text style={s.small}>
        인기 차트는 실제 이용 데이터가 쌓이면 제공할 예정이에요.
      </Text>
    </Page>
  );
}
