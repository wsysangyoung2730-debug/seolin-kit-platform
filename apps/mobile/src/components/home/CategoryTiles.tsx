import {
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { categories } from "../../data/catalog";
import { c } from "../ui";
const pictures: Record<string, number> = {
  game: require("../../../assets/category-game.png"),
  education: require("../../../assets/category-education.png"),
  editing: require("../../../assets/category-editing.png"),
  classroom: require("../../../assets/category-classroom.png"),
};
export default function CategoryTiles() {
  const { width, fontScale } = useWindowDimensions();
  const twoColumns = fontScale > 1.25 || width < 340;
  const iconSize = width >= 600 ? 86 : twoColumns ? 64 : 58;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {categories.slice(1).map((category) => (
        <Pressable
          key={category.id}
          accessibilityRole="button"
          accessibilityLabel={`${category.name} 미니앱 보기`}
          onPress={() =>
            router.push({
              pathname: "/explore",
              params: { category: category.id },
            })
          }
          style={({ pressed }) => ({
            flexGrow: 1,
            flexBasis: twoColumns ? "45%" : "20%",
            minHeight: width >= 600 ? 150 : 116,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            paddingHorizontal: 3,
            borderRadius: 24,
            backgroundColor: pressed ? "#DEE4FF" : "#EEF0FF",
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Image
            source={pictures[category.id]}
            resizeMode="contain"
            resizeMethod="resize"
            style={{ width: iconSize, height: iconSize }}
          />
          <Text
            style={{
              color: c.brandStrong,
              fontSize: width >= 600 ? 18 : 14,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {category.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
