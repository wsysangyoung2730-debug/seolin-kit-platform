import { useId } from "react";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Image as SvgImage,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import type { LuckyModeId } from "../../tools/lucky-draw";
import { luckyAssets } from "./assets";

export type LuckySceneProps = {
  mode: LuckyModeId;
  stage: "idle" | "ready" | "active" | "reveal";
  selected: number | null;
  progress: number;
  resultKind?: "prize" | "miss";
};

const navy = "#202D78";
const gold = "#FFDA75";
const slots = [
  { x: 65, y: 70 },
  { x: 150, y: 70 },
  { x: 235, y: 70 },
  { x: 65, y: 181 },
  { x: 150, y: 181 },
  { x: 235, y: 181 },
];

function PropImage({
  mode,
  x,
  y,
  width,
  height = width,
}: {
  mode: LuckyModeId;
  x: number;
  y: number;
  width: number;
  height?: number;
}) {
  return (
    <SvgImage
      href={luckyAssets[mode]}
      x={x}
      y={y}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

function NumberBadge({
  x,
  y,
  value,
  chosen = false,
}: {
  x: number;
  y: number;
  value: number;
  chosen?: boolean;
}) {
  return (
    <G>
      <Circle
        cx={x}
        cy={y}
        r={12}
        fill={chosen ? gold : navy}
        stroke="#FFFFFF"
        strokeWidth={1.7}
      />
      <SvgText
        x={x}
        y={y + 4.5}
        textAnchor="middle"
        fontSize={12}
        fontFamily="Arial"
        fontWeight="800"
        fill={chosen ? navy : "#FFFFFF"}
      >
        {value}
      </SvgText>
    </G>
  );
}

function ResultMark({
  x,
  y,
  kind,
  size = 13,
}: {
  x: number;
  y: number;
  kind?: "prize" | "miss";
  size?: number;
}) {
  return kind === "miss" ? (
    <G>
      <Circle cx={x} cy={y} r={size} fill="#C5D0F5" />
      <Path
        d={`M${x - size * 0.4} ${y + size * 0.2}Q${x} ${y + size * 0.6} ${x + size * 0.4} ${y + size * 0.2}`}
        fill="none"
        stroke={navy}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={x - size * 0.3} cy={y - size * 0.25} r={1.3} fill={navy} />
      <Circle cx={x + size * 0.3} cy={y - size * 0.25} r={1.3} fill={navy} />
    </G>
  ) : (
    <Path
      d={`M${x} ${y - size}l${size * 0.3} ${size * 0.65} ${size * 0.7} ${size * 0.35}-${size * 0.7} ${size * 0.3}-${size * 0.3} ${size * 0.7}-${size * 0.3}-${size * 0.7}-${size * 0.7}-${size * 0.3} ${size * 0.7}-${size * 0.35}Z`}
      fill={gold}
      stroke="#AE7B29"
      strokeWidth={1.2}
    />
  );
}

function RevealCard({
  x,
  y,
  kind,
  width = 38,
  height = 48,
}: {
  x: number;
  y: number;
  kind?: "prize" | "miss";
  width?: number;
  height?: number;
}) {
  return (
    <G>
      <Rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={6}
        fill="#FFFAEB"
        stroke="#D5B16A"
        strokeWidth={1.5}
      />
      <ResultMark x={x} y={y} kind={kind} size={Math.min(width * 0.3, 14)} />
    </G>
  );
}

function Halo({
  x,
  y,
  width,
  height,
  chosen,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  chosen: boolean;
}) {
  return (
    <Rect
      x={x - width / 2}
      y={y - height / 2}
      width={width}
      height={height}
      rx={18}
      fill={chosen ? "#F9D474" : "#D8E2FF"}
      fillOpacity={chosen ? 0.14 : 0.04}
      stroke={chosen ? gold : "#9AAAD8"}
      strokeOpacity={chosen ? 0.9 : 0.18}
      strokeWidth={chosen ? 2 : 1}
    />
  );
}

function CapsuleScene({ stage, resultKind }: LuckySceneProps) {
  return (
    <G>
      <Ellipse cx={150} cy={250} rx={80} ry={6} fill="#101A3A" opacity={0.3} />
      <PropImage mode="capsule" x={20} y={-4} width={260} />
      {stage === "reveal" && (
        <G>
          <Path
            d="M124 239Q150 219 176 239L173 253H127Z"
            fill="#FFFAEB"
            stroke="#C4CFF4"
            strokeWidth={2}
          />
          <Path
            d="M124 223Q150 197 176 223"
            fill="#F58B7D"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
          <RevealCard
            x={150}
            y={226}
            kind={resultKind}
            width={35}
            height={43}
          />
        </G>
      )}
    </G>
  );
}

function RouletteScene({ selected, stage, resultKind }: LuckySceneProps) {
  return (
    <G>
      <PropImage mode="roulette" x={15} y={-5} width={270} />
      {Array.from({ length: 6 }, (_, index) => {
        // The generated wheel's cream sector is centred at twelve o'clock.
        const angle = ((-90 + index * 60) * Math.PI) / 180;
        const x = 150 + Math.cos(angle) * 77;
        const y = 130 + Math.sin(angle) * 77;
        return (
          <NumberBadge
            key={index}
            x={x}
            y={y}
            value={index + 1}
            chosen={selected === index}
          />
        );
      })}
      {stage === "reveal" && (
        <G>
          <Circle
            cx={150}
            cy={130}
            r={19}
            fill="#FFFAEB"
            stroke="#D6B261"
            strokeWidth={2}
          />
          <ResultMark x={150} y={130} kind={resultKind} size={13} />
        </G>
      )}
    </G>
  );
}

function MittsScene({ selected, stage, resultKind }: LuckySceneProps) {
  return (
    <G>
      {[
        { x: 95, y: 70 },
        { x: 205, y: 70 },
        { x: 95, y: 181 },
        { x: 205, y: 181 },
      ].map(({ x, y }, index) => {
        const chosen = selected === index;
        return (
          <G key={index} opacity={selected !== null && !chosen ? 0.27 : 1}>
            <Halo x={x} y={y} width={100} height={100} chosen={chosen} />
            <PropImage mode="mitts" x={x - 53} y={y - 53} width={106} />
            {chosen && stage === "reveal" ? (
              <G>
                <Circle
                  cx={x - 12}
                  cy={y - 16}
                  r={19}
                  fill="#FFFAEB"
                  stroke="#D6B261"
                  strokeWidth={2}
                />
                <ResultMark x={x - 12} y={y - 16} kind={resultKind} size={13} />
              </G>
            ) : (
              <NumberBadge
                x={x - 32}
                y={y + 32}
                value={index + 1}
                chosen={chosen}
              />
            )}
          </G>
        );
      })}
    </G>
  );
}

function LockersScene({
  selected,
  stage,
  resultKind,
  id,
}: LuckySceneProps & { id: string }) {
  return (
    <G>
      {slots.map(({ x, y }, index) => {
        const chosen = selected === index;
        const open = chosen && stage === "reveal";
        // The generated door's hinges are on the right: crop just the door panel,
        // then narrow that panel around its hinge while retaining the wooden case.
        const doorX = x - 32,
          doorY = y - 38,
          doorW = 55,
          doorH = 79;
        return (
          <G key={index} opacity={selected !== null && !chosen ? 0.27 : 1}>
            <Halo x={x} y={y} width={78} height={102} chosen={chosen} />
            <PropImage mode="lockers" x={x - 64} y={y - 64} width={128} />
            {open && (
              <G>
                <Rect
                  x={doorX}
                  y={doorY}
                  width={doorW}
                  height={doorH}
                  rx={3}
                  fill="#111C37"
                  stroke="#DDC9A6"
                  strokeWidth={1}
                />
                <RevealCard
                  x={x - 8}
                  y={y + 1}
                  kind={resultKind}
                  width={32}
                  height={44}
                />
                <G
                  transform={`translate(${doorX + doorW} 0) scale(.2 1) translate(${-doorX - doorW} 0)`}
                >
                  <G clipPath={`url(#${id}-door-${index})`}>
                    <PropImage
                      mode="lockers"
                      x={x - 64}
                      y={y - 64}
                      width={128}
                    />
                  </G>
                </G>
              </G>
            )}
            <NumberBadge
              x={x + 26}
              y={y - 40}
              value={index + 1}
              chosen={chosen}
            />
          </G>
        );
      })}
    </G>
  );
}

function ScrollsScene({ selected, stage, resultKind }: LuckySceneProps) {
  return (
    <G>
      {[65, 150, 235].map((x, index) => {
        const chosen = selected === index;
        return (
          <G key={index} opacity={selected !== null && !chosen ? 0.27 : 1}>
            <Halo x={x} y={130} width={79} height={166} chosen={chosen} />
            <PropImage mode="scrolls" x={x - 68} y={62} width={136} />
            {chosen && stage === "reveal" && (
              <G>
                <Rect
                  x={x - 21}
                  y={94}
                  width={41}
                  height={76}
                  rx={3}
                  fill="#FFF4D7"
                  stroke="#DCC391"
                  strokeWidth={1}
                />
                <Path
                  d={`M${x - 15} 105H${x + 15}M${x - 13} 111H${x + 11}`}
                  stroke="#C6AF83"
                  strokeWidth={2}
                />
                <Circle
                  cx={x}
                  cy={143}
                  r={17}
                  fill="#FFF9EB"
                  stroke={resultKind === "miss" ? "#9AAAD8" : "#CF745D"}
                  strokeWidth={2.5}
                />
                <ResultMark x={x} y={143} kind={resultKind} size={12} />
              </G>
            )}
            <NumberBadge x={x} y={216} value={index + 1} chosen={chosen} />
          </G>
        );
      })}
    </G>
  );
}

function UniformsScene({ selected, stage, resultKind }: LuckySceneProps) {
  return (
    <G>
      {[65, 150, 235].map((x, index) => {
        const chosen = selected === index;
        return (
          <G key={index} opacity={selected !== null && !chosen ? 0.27 : 1}>
            <Halo x={x} y={130} width={80} height={180} chosen={chosen} />
            <PropImage mode="uniforms" x={x - 67.5} y={62.5} width={135} />
            {chosen && stage === "reveal" && (
              <G>
                <RevealCard
                  x={x - 17}
                  y={109}
                  kind={resultKind}
                  width={32}
                  height={43}
                />
                <Path
                  d={`M${x - 28} 136Q${x - 17} 142 ${x - 6} 136`}
                  fill="none"
                  stroke="#A7B2CD"
                  strokeWidth={2}
                />
              </G>
            )}
            <NumberBadge x={x} y={232} value={index + 1} chosen={chosen} />
          </G>
        );
      })}
    </G>
  );
}

function MedalsScene({ stage, resultKind }: LuckySceneProps) {
  return (
    <G>
      <Ellipse cx={150} cy={250} rx={69} ry={6} fill="#101A3A" opacity={0.3} />
      <PropImage mode="medals" x={23} y={3} width={254} />
      {stage === "reveal" && (
        <G>
          <Circle
            cx={150}
            cy={164}
            r={26}
            fill="#FFF1BC"
            stroke="#D9AB50"
            strokeWidth={2}
          />
          <ResultMark x={150} y={164} kind={resultKind} size={19} />
        </G>
      )}
    </G>
  );
}

function TigerScene({ stage, resultKind, progress }: LuckySceneProps) {
  return (
    <G>
      <Ellipse cx={150} cy={250} rx={70} ry={6} fill="#101A3A" opacity={0.3} />
      {stage === "active" && (
        <G opacity={0.5 + Math.min(1, Math.max(0, progress)) * 0.5}>
          <Path
            d="M48 47L35 25M38 70L16 64M253 53L270 32M263 78L286 72"
            fill="none"
            stroke={gold}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </G>
      )}
      <PropImage mode="tiger" x={21} y={0} width={258} />
      {stage === "reveal" && (
        <G>
          <Ellipse
            cx={210}
            cy={162}
            rx={22}
            ry={7}
            fill="#111C37"
            stroke={gold}
            strokeWidth={2}
          />
          <RevealCard
            x={209}
            y={139}
            kind={resultKind}
            width={40}
            height={50}
          />
          <Path
            d="M186 118L181 107M232 117L239 108"
            fill="none"
            stroke={gold}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </G>
      )}
    </G>
  );
}

function RotatingScene({
  selected,
  stage,
  progress,
  resultKind,
  id,
}: LuckySceneProps & { id: string }) {
  return (
    <G>
      <Circle
        cx={150}
        cy={130}
        r={85}
        fill="none"
        stroke="#8CA0D7"
        strokeOpacity={0.3}
        strokeWidth={2}
        strokeDasharray="4 6"
      />
      {Array.from({ length: 5 }, (_, index) => {
        const angle = ((-90 + index * 72) * Math.PI) / 180;
        const x = 150 + Math.cos(angle) * 85,
          y = 130 + Math.sin(angle) * 85;
        const chosen = selected === index;
        const open = chosen && stage === "reveal";
        const plank = (
          <PropImage mode="rotating" x={-44} y={-30} width={88} height={60} />
        );
        return (
          <G
            key={index}
            transform={`translate(${x} ${y}) rotate(${index * 72})`}
            opacity={selected !== null && !chosen ? 0.35 : 1}
          >
            {chosen && (
              <Ellipse
                cx={0}
                cy={0}
                rx={49}
                ry={30}
                fill={gold}
                fillOpacity={0.12}
                stroke={gold}
                strokeOpacity={0.5}
              />
            )}
            {open ? (
              <G>
                <G transform="translate(-8 4) rotate(-13)">
                  <G clipPath={`url(#${id}-left-plank)`}>{plank}</G>
                </G>
                <G transform="translate(8 4) rotate(13)">
                  <G clipPath={`url(#${id}-right-plank)`}>{plank}</G>
                </G>
                <Path
                  d="M-4 -31L0 -39M-30 -22L-38 -28M30 -22L38 -28"
                  stroke={gold}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <Circle cx={0} cy={0} r={14} fill="#FFFAEB" />
                <ResultMark x={0} y={0} kind={resultKind} size={10} />
              </G>
            ) : (
              <G>
                {plank}
                {chosen && stage === "active" && progress > 0.5 && (
                  <Path
                    d="M0 -19L-5 -10L4 -3L-3 6L4 17"
                    fill="none"
                    stroke="#643517"
                    strokeWidth={3}
                  />
                )}
                <NumberBadge x={0} y={0} value={index + 1} chosen={chosen} />
              </G>
            )}
          </G>
        );
      })}
      <Circle
        cx={150}
        cy={130}
        r={26}
        fill={navy}
        stroke="#DDBA70"
        strokeWidth={2}
      />
      <Path
        d="M139 125A13 13 0 0 1 162 123L166 118V131H153L158 127A7 7 0 0 0 144 128M161 137A13 13 0 0 1 138 139L134 144V131H147L142 135A7 7 0 0 0 156 134"
        fill={gold}
      />
    </G>
  );
}

function Celebration() {
  return (
    <G>
      {[
        { x: 28, y: 43, r: -20 },
        { x: 271, y: 34, r: 22 },
        { x: 22, y: 205, r: 30 },
        { x: 280, y: 206, r: -30 },
      ].map(({ x, y, r }, index) => (
        <G key={index} transform={`translate(${x} ${y}) rotate(${r})`}>
          <Rect
            x={-2}
            y={-7}
            width={4}
            height={14}
            rx={2}
            fill={index % 2 ? "#F58B7D" : gold}
          />
          <Circle cx={index % 2 ? -9 : 9} cy={8} r={2.5} fill="#A9BAF6" />
        </G>
      ))}
    </G>
  );
}

/** Generated props are the actual game objects; code adds state, numbers and reveal masks. */
export default function LuckyScene(props: LuckySceneProps) {
  const id = `lucky${useId().replace(/[^a-z0-9]/gi, "")}`;
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 300 260"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        {slots.map(({ x, y }, index) => (
          <ClipPath key={index} id={`${id}-door-${index}`}>
            <Rect x={x - 32} y={y - 38} width={55} height={79} rx={3} />
          </ClipPath>
        ))}
        <ClipPath id={`${id}-left-plank`}>
          <Path d="M-50 -40H0L-4 -12L3 -4L-3 6L2 40H-50Z" />
        </ClipPath>
        <ClipPath id={`${id}-right-plank`}>
          <Path d="M0 -40H50V40H2L-3 6L3 -4L-4 -12Z" />
        </ClipPath>
      </Defs>
      {props.mode === "capsule" && <CapsuleScene {...props} />}
      {props.mode === "roulette" && <RouletteScene {...props} />}
      {props.mode === "mitts" && <MittsScene {...props} />}
      {props.mode === "lockers" && <LockersScene {...props} id={id} />}
      {props.mode === "scrolls" && <ScrollsScene {...props} />}
      {props.mode === "uniforms" && <UniformsScene {...props} />}
      {props.mode === "medals" && <MedalsScene {...props} />}
      {props.mode === "tiger" && <TigerScene {...props} />}
      {props.mode === "rotating" && <RotatingScene {...props} id={id} />}
      {props.stage === "reveal" &&
        props.resultKind === "prize" &&
        props.mode !== "roulette" &&
        props.mode !== "rotating" && <Celebration />}
    </Svg>
  );
}
