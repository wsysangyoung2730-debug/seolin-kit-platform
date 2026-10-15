import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

/** Stopwatch and energy bolt distinguish interval workouts from lesson timing. */
export default function TabataIcon({ size = 64 }: { size?: number }) {
  const gradient = `tabata${useId().replace(/[^a-z0-9]/gi, "")}`;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityElementsHidden
    >
      <Defs>
        <LinearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6577DD" />
          <Stop offset="1" stopColor="#202D78" />
        </LinearGradient>
      </Defs>
      <Rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="24"
        fill={`url(#${gradient})`}
      />
      <Path
        d="M14 29Q14 12 32 12H73"
        stroke="#FFFFFF"
        strokeOpacity=".2"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M45 18H57M51 19V27M71 31L77 25"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <Circle
        cx="51"
        cy="56"
        r="28"
        fill="#16215C"
        fillOpacity=".32"
        stroke="#FFFFFF"
        strokeWidth="6"
      />
      <Path
        d="M54 35L36 59H49L45 77L66 50H53Z"
        fill="#FFB38D"
        stroke="#F26B61"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path
        d="M27 54H31M71 54H75M51 79V81"
        stroke="#FFFFFF"
        strokeOpacity=".65"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}
