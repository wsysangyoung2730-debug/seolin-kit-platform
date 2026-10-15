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
export default function ClassroomIcon({
  size = 64,
  kind = "timer",
}: {
  size?: number;
  kind?: "timer" | "teams";
}) {
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
      {kind === "timer" ? (
        <>
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
        </>
      ) : (
        <>
          <Circle cx="32" cy="34" r="11" fill="#FFFFFF" />
          <Circle cx="65" cy="34" r="11" fill="#C7D1FF" />
          <Path
            d="M13 68V62a19 19 0 0 1 38 0v6Q51 73 46 73H18Q13 73 13 68Z"
            fill="#FFFFFF"
          />
          <Path d="M51 65V61a18 18 0 0 1 32-10v14Z" fill="#C7D1FF" />
          <Rect x="56" y="58" width="29" height="29" rx="8" fill="#FFCE78" />
          <Circle cx="64" cy="66" r="2.5" fill="#202D78" />
          <Circle cx="71" cy="73" r="2.5" fill="#202D78" />
          <Circle cx="78" cy="80" r="2.5" fill="#202D78" />
        </>
      )}
    </Svg>
  );
}
