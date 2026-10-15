import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

/** Native vector artwork stays crisp in the library and on mirrored screens. */
export default function ClassroomIcon({ size = 64 }: { size?: number }) {
  const gradient = `tool${useId().replace(/[^a-z0-9]/gi, "")}`;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityElementsHidden
    >
      <Defs>
        <LinearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7C8EFA" />
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
        d="M14 30Q14 12 33 12H75"
        stroke="#FFFFFF"
        strokeOpacity=".24"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="54" r="27" fill="#192864" opacity=".2" />
      <Circle
        cx="50"
        cy="50"
        r="27"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="7"
      />
      <Path
        d="M50 32V50L64 59"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="77" cy="25" r="8" fill="#FFCE78" />
    </Svg>
  );
}
