import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import type { LuckyModeId } from "../../tools/lucky-draw";

export type LuckySceneProps = {
  mode: LuckyModeId;
  stage: "idle" | "ready" | "active" | "reveal";
  selected: number | null;
  progress: number;
  resultKind?: "prize" | "miss";
};

const navy = "#202D78";
const ink = "#172148";
const beltColors = [
  "#FFDA75",
  "#8DDCB7",
  "#7DAAEE",
  "#A99BEF",
  "#F68F85",
  "#46568B",
];
const slots = [
  { x: 65, y: 70 },
  { x: 150, y: 70 },
  { x: 235, y: 70 },
  { x: 65, y: 181 },
  { x: 150, y: 181 },
  { x: 235, y: 181 },
];

function NumberBadge({
  x,
  y,
  value,
  color = navy,
  light = false,
}: {
  x: number;
  y: number;
  value: number;
  color?: string;
  light?: boolean;
}) {
  return (
    <G>
      <Circle
        cx={x}
        cy={y}
        r={11}
        fill={light ? "#FFFFFF" : color}
        stroke={light ? "#E1E5F2" : "#FFFFFF"}
        strokeWidth={1.5}
      />
      <SvgText
        x={x}
        y={y + 4.5}
        textAnchor="middle"
        fontSize={12}
        fontFamily="Arial"
        fontWeight="800"
        fill={light ? navy : "#FFFFFF"}
      >
        {value}
      </SvgText>
    </G>
  );
}

function Star({
  x,
  y,
  size = 13,
  color = "#FFD56D",
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
}) {
  return (
    <Path
      d={`M${x} ${y - size}l${size * 0.29} ${size * 0.68} ${size * 0.71} ${size * 0.32}-${size * 0.71} ${size * 0.31}-${size * 0.29} ${size * 0.69}-${size * 0.31}-${size * 0.69}-${size * 0.69}-${size * 0.31} ${size * 0.69}-${size * 0.32}Z`}
      fill={color}
    />
  );
}

function ResultMark({
  x,
  y,
  resultKind,
  size = 13,
}: {
  x: number;
  y: number;
  resultKind?: "prize" | "miss";
  size?: number;
}) {
  if (resultKind === "miss")
    return (
      <G>
        <Circle cx={x} cy={y} r={size} fill="#EDF0FF" />
        <Path
          d={`M${x - size * 0.45} ${y + size * 0.08}Q${x} ${y + size * 0.65} ${x + size * 0.45} ${y + size * 0.08}`}
          fill="none"
          stroke={navy}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Circle cx={x - size * 0.33} cy={y - size * 0.3} r={1.4} fill={navy} />
        <Circle cx={x + size * 0.33} cy={y - size * 0.3} r={1.4} fill={navy} />
      </G>
    );
  return <Star x={x} y={y} size={size} color={navy} />;
}

function SelectionHalo({
  x,
  y,
  active,
  round = false,
}: {
  x: number;
  y: number;
  active: boolean;
  round?: boolean;
}) {
  if (!active) return null;
  return (
    <G>
      {round ? (
        <Circle
          cx={x}
          cy={y}
          r={43}
          fill="#EDF0FF"
          stroke="#6877DE"
          strokeWidth={2.5}
        />
      ) : (
        <Rect
          x={x - 40}
          y={y - 48}
          width={80}
          height={99}
          rx={17}
          fill="#EDF0FF"
          stroke="#6877DE"
          strokeWidth={2.5}
        />
      )}
      <Star x={x + 34} y={y - 40} size={7} color="#F26B61" />
    </G>
  );
}

function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <G>
      <Star x={29} y={30} size={8} color="#F6B74D" />
      <Star x={272} y={62} size={8} color="#9B89E9" />
      <Star x={25} y={200} size={5} color="#7DAAEE" />
      <Circle cx={270} cy={213} r={4} fill="#F68F85" />
      <Path
        d="M48 16l4 8M254 20l-5 7M16 130l7 3M277 158l7-4"
        stroke="#8DDCB7"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </G>
  );
}

function CapsuleScene({
  stage,
  progress,
  resultKind,
  id,
}: LuckySceneProps & { id: string }) {
  const released = stage === "reveal";
  const turning =
    stage === "active"
      ? Math.min(1, Math.max(0, progress)) * 100
      : released
        ? 105
        : 0;
  return (
    <G>
      <Ellipse cx={150} cy={243} rx={94} ry={9} fill="#DDE3F6" />
      <Path d="M91 38Q91 19 110 19H190Q209 19 209 38V58H91Z" fill={navy} />
      <Path
        d="M103 35H197"
        stroke="#92A0EB"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path
        d="M82 54Q150 31 218 54V130Q218 154 195 154H105Q82 154 82 130Z"
        fill={`url(#${id}-glass)`}
        stroke="#95A8D9"
        strokeWidth={3}
      />
      <Path
        d="M95 61V97"
        stroke="#FFFFFF"
        strokeWidth={7}
        strokeOpacity={0.9}
        strokeLinecap="round"
      />
      {[
        [111, 90, 0],
        [147, 79, 1],
        [184, 91, 2],
        [102, 124, 3],
        [136, 115, 4],
        [171, 128, 0],
        [198, 118, 1],
      ].map(([x = 0, y = 0, index = 0], position) => (
        <G
          key={position}
          transform={`translate(${x},${y + (stage === "active" ? (position % 2 ? -3 : 3) : 0)}) rotate(${position % 2 ? -20 : 20})`}
        >
          <Circle
            r={17}
            fill={beltColors[index]}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
          <Path
            d="M-16 0A16 16 0 0 0 16 0Z"
            fill="#FFFFFF"
            fillOpacity={0.65}
          />
          <Path
            d="M-15 0H15"
            stroke={navy}
            strokeOpacity={0.22}
            strokeWidth={1.5}
          />
          <Ellipse
            cx={-5}
            cy={-6}
            rx={4}
            ry={2}
            fill="#FFFFFF"
            opacity={0.65}
          />
        </G>
      ))}
      <Path
        d="M83 142H217L235 158L221 180L208 170V229H92V170L79 180L65 158Z"
        fill={`url(#${id}-cloth)`}
        stroke={navy}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M126 143L150 167L174 143M138 143L159 164"
        stroke={navy}
        strokeWidth={5}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M92 177H208V189H92Z" fill={ink} />
      <Path
        d="M149 181L157 208L166 203L156 181M149 181L140 204L130 200L141 181"
        fill={ink}
      />
      <Rect x={101} y={198} width={38} height={23} rx={8} fill={navy} />
      <Path
        d="M107 202H133"
        stroke="#6877DE"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle
        cx={184}
        cy={207}
        r={15}
        fill="#FFDA75"
        stroke="#DE9C3E"
        strokeWidth={2}
      />
      <G transform={`rotate(${turning},184,207)`}>
        <Rect x={180} y={196} width={8} height={22} rx={4} fill={navy} />
      </G>
      {released && (
        <G>
          <Circle
            cx={120}
            cy={226}
            r={20}
            fill="#F68F85"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
          <Path d="M100 226A20 20 0 0 0 140 226Z" fill="#FFFFFF" />
          <ResultMark x={120} y={225} resultKind={resultKind} size={11} />
        </G>
      )}
    </G>
  );
}

function RouletteScene({ selected, stage }: LuckySceneProps) {
  const point = (angle: number, radius: number) => ({
    x: 150 + Math.cos(angle) * radius,
    y: 130 + Math.sin(angle) * radius,
  });
  return (
    <G>
      <Circle cx={150} cy={130} r={119} fill="#DDE3F6" />
      <Circle cx={150} cy={130} r={115} fill={navy} />
      {beltColors.map((color, index) => {
        const begin = -Math.PI / 2 + (index * Math.PI) / 3;
        const a = point(begin, 104),
          b = point(begin + Math.PI / 3, 104),
          number = point(begin + Math.PI / 6, 74);
        return (
          <G key={color}>
            <Path
              d={`M150 130L${a.x} ${a.y}A104 104 0 0 1 ${b.x} ${b.y}Z`}
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={3}
            />
            {selected === index && stage === "reveal" && (
              <Path
                d={`M150 130L${a.x} ${a.y}A104 104 0 0 1 ${b.x} ${b.y}Z`}
                fill="#FFFFFF"
                fillOpacity={0.2}
                stroke="#FFFFFF"
                strokeWidth={5}
              />
            )}
            <NumberBadge x={number.x} y={number.y} value={index + 1} light />
          </G>
        );
      })}
      {Array.from({ length: 24 }, (_, index) => {
        const dot = point((index * Math.PI) / 12, 111);
        return (
          <Circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            r={2.1}
            fill="#FFFFFF"
            opacity={index % 2 ? 0.45 : 1}
          />
        );
      })}
      <Circle
        cx={150}
        cy={130}
        r={27}
        fill="#FFFFFF"
        stroke={navy}
        strokeWidth={4}
      />
      <Path
        d="M132 122H168V131H132ZM146 127L139 146L148 149L155 129L163 144L171 139L158 122"
        fill={navy}
      />
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
          <G key={index}>
            <SelectionHalo x={x} y={y + 5} active={chosen} />
            <Ellipse cx={x} cy={y + 44} rx={26} ry={5} fill="#DDE3F6" />
            <G
              transform={`translate(${x},${y}) rotate(${chosen && stage === "active" ? 0 : index % 2 ? 12 : -12})`}
            >
              <Path
                d="M-9 15L-8 38Q0 47 8 38L9 15"
                fill={navy}
                stroke={ink}
                strokeWidth={2}
              />
              <Path
                d="M-7 27H7M-7 33H7"
                stroke="#FFFFFF"
                strokeOpacity={0.4}
                strokeWidth={2}
              />
              <Path
                d="M-26-11Q-28-37 0-39Q28-37 26-11L19 14Q16 24 0 25Q-16 24-19 14Z"
                fill={beltColors[index]}
                stroke={navy}
                strokeWidth={2}
              />
              <Path
                d="M-19-9Q0-19 19-9M-19 1Q0-9 19 1"
                stroke="#FFFFFF"
                strokeOpacity={0.7}
                strokeWidth={4}
                fill="none"
              />
              <Path
                d="M-17-23Q-11-30-3-30"
                stroke="#FFFFFF"
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0.65}
              />
              {chosen && stage === "reveal" ? (
                <ResultMark x={0} y={6} resultKind={resultKind} size={12} />
              ) : (
                <NumberBadge x={0} y={7} value={index + 1} />
              )}
            </G>
          </G>
        );
      })}
    </G>
  );
}

function LockersScene({ selected, stage, resultKind }: LuckySceneProps) {
  return (
    <G>
      <Ellipse cx={150} cy={246} rx={125} ry={7} fill="#DDE3F6" />
      <Rect x={20} y={15} width={260} height={228} rx={15} fill={navy} />
      <Rect x={28} y={23} width={244} height={212} rx={10} fill="#D6DEF3" />
      {slots.map(({ x }, index) => {
        const y = index < 3 ? 30 : 134;
        const left = x - 34;
        const chosen = selected === index;
        const open = chosen && stage === "reveal";
        return (
          <G key={index}>
            <Rect
              x={left}
              y={y}
              width={68}
              height={96}
              rx={7}
              fill={open ? "#172148" : beltColors[index]}
              stroke={chosen ? "#FFFFFF" : "#6E7BA7"}
              strokeWidth={chosen ? 3 : 1.5}
            />
            {open ? (
              <G>
                <Rect
                  x={x - 16}
                  y={y + 32}
                  width={35}
                  height={43}
                  rx={5}
                  fill="#FFFFFF"
                />
                <ResultMark
                  x={x + 1}
                  y={y + 53}
                  resultKind={resultKind}
                  size={13}
                />
                <Path
                  d={`M${left + 2} ${y + 2}L${left + 18} ${y + 11}V${y + 86}L${left + 2} ${y + 94}Z`}
                  fill={beltColors[index]}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                <Circle cx={left + 13} cy={y + 48} r={2} fill={navy} />
                <NumberBadge x={x + 13} y={y + 14} value={index + 1} />
              </G>
            ) : (
              <G>
                <Path
                  d={`M${left + 13} ${y + 14}H${left + 54}M${left + 13} ${y + 20}H${left + 54}M${left + 13} ${y + 78}H${left + 54}`}
                  stroke={navy}
                  strokeOpacity={0.23}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <NumberBadge x={x} y={y + 44} value={index + 1} light />
                <Rect
                  x={left + 56}
                  y={y + 45}
                  width={4}
                  height={15}
                  rx={2}
                  fill={navy}
                  opacity={0.75}
                />
              </G>
            )}
          </G>
        );
      })}
    </G>
  );
}

function ScrollsScene({
  selected,
  stage,
  resultKind,
  id,
}: LuckySceneProps & { id: string }) {
  return (
    <G>
      {slots.slice(0, 3).map(({ x }, index) => {
        const y = 130;
        const chosen = selected === index;
        const opened = chosen && stage === "reveal";
        return (
          <G key={index}>
            <SelectionHalo x={x} y={y} active={chosen} />
            <Ellipse cx={x} cy={y + 43} rx={31} ry={5} fill="#DDE3F6" />
            <G
              transform={`translate(${x},${y}) rotate(${chosen ? 0 : index % 2 ? 4 : -4})`}
            >
              <Rect
                x={-26}
                y={-34}
                width={52}
                height={73}
                rx={3}
                fill={`url(#${id}-paper)`}
                stroke="#D4B371"
                strokeWidth={1.5}
              />
              <Rect
                x={-34}
                y={-39}
                width={68}
                height={12}
                rx={6}
                fill={beltColors[index]}
                stroke={navy}
                strokeWidth={1.5}
              />
              <Rect
                x={-34}
                y={33}
                width={68}
                height={10}
                rx={5}
                fill={beltColors[index]}
                stroke={navy}
                strokeWidth={1.5}
              />
              <Path d="M-20-27V33M20-27V33" stroke="#E1C48B" strokeWidth={1} />
              {opened ? (
                <G>
                  <Path
                    d="M-12-17H12M-12-10H7"
                    stroke="#B6A07E"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <Circle
                    cx={1}
                    cy={14}
                    r={16}
                    fill="none"
                    stroke="#D05B55"
                    strokeWidth={2.5}
                  />
                  <ResultMark x={1} y={14} resultKind={resultKind} size={10} />
                </G>
              ) : (
                <G>
                  <Path d="M-5-27H5V35H-5Z" fill="#D96160" />
                  <Path d="M-22-3H22V7H-22Z" fill="#E77970" />
                  <NumberBadge x={0} y={2} value={index + 1} color="#C7474D" />
                </G>
              )}
            </G>
          </G>
        );
      })}
    </G>
  );
}

function UniformsScene({
  selected,
  stage,
  resultKind,
  id,
}: LuckySceneProps & { id: string }) {
  return (
    <G>
      {slots.slice(0, 3).map(({ x }, index) => {
        const y = 130;
        const chosen = selected === index;
        const opened = chosen && stage === "reveal";
        return (
          <G key={index}>
            <SelectionHalo x={x} y={y} active={chosen} />
            <Ellipse cx={x} cy={y + 44} rx={31} ry={5} fill="#DDE3F6" />
            <G transform={`translate(${x},${y})`}>
              <Path
                d="M-17-35H17L40-13L29 2L23-4V40H-23V-4L-29 2L-40-13Z"
                fill={`url(#${id}-cloth)`}
                stroke="#7C89B0"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              <Path
                d="M-12-34L0-15L12-34M-4-31L7-18"
                stroke={navy}
                strokeWidth={4}
                fill="none"
                strokeLinejoin="round"
              />
              <Path
                d="M-23 13H23V22H-23Z"
                fill={beltColors[index]}
                stroke={navy}
                strokeWidth={0.75}
              />
              <Path
                d="M0 17L-7 34L1 37L7 21L15 33L20 28L7 15"
                fill={beltColors[index]}
                stroke={navy}
                strokeWidth={0.75}
                strokeLinejoin="round"
              />
              <Rect
                x={3}
                y={-10}
                width={17}
                height={19}
                rx={3}
                fill="#DDE3F6"
                stroke="#7C89B0"
                strokeWidth={1}
              />
              {opened ? (
                <G>
                  <Rect
                    x={0}
                    y={-22}
                    width={23}
                    height={24}
                    rx={3}
                    fill="#FFDA75"
                    stroke="#DAAD51"
                    strokeWidth={1}
                  />
                  <ResultMark x={11} y={-11} resultKind={resultKind} size={8} />
                  <Path
                    d="M3-2L11 4L20-2V9H3Z"
                    fill="#FFFFFF"
                    stroke="#7C89B0"
                    strokeWidth={1}
                  />
                </G>
              ) : (
                <NumberBadge x={-11} y={0} value={index + 1} />
              )}
            </G>
          </G>
        );
      })}
    </G>
  );
}

function MedalsScene({
  stage,
  resultKind,
  progress,
  id,
}: LuckySceneProps & { id: string }) {
  const opened = stage === "reveal";
  const lifted = stage === "active" || opened;
  const y = lifted ? 95 : 133;
  const tilt = stage === "active" ? Math.min(1, Math.max(0, progress)) * 7 : 0;
  return (
    <G>
      <Ellipse cx={150} cy={244} rx={86} ry={8} fill="#DDE3F6" />
      <Path
        d="M75 185H225L214 239H86Z"
        fill={navy}
        stroke={ink}
        strokeWidth={2}
      />
      <Rect x={75} y={179} width={150} height={16} rx={6} fill="#6877DE" />
      <Path
        d="M90 179L107 153H193L210 179"
        fill="#E7ECFA"
        stroke={navy}
        strokeWidth={2}
      />
      <Path
        d="M105 209H195M113 218H187"
        stroke="#FFFFFF"
        strokeOpacity={0.18}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <G transform={`translate(150,${y}) rotate(${tilt})`}>
        <Path
          d="M-39-57H-15L10 5L-13 16Z"
          fill="#F68F85"
          stroke={navy}
          strokeWidth={1.5}
        />
        <Path
          d="M15-57H39L13 16L-10 5Z"
          fill="#7DAAEE"
          stroke={navy}
          strokeWidth={1.5}
        />
        <Path
          d="M-31-51L-5 8M31-51L5 8"
          stroke="#FFFFFF"
          strokeOpacity={0.75}
          strokeWidth={5}
        />
        <Circle
          cx={0}
          cy={10}
          r={10}
          fill="none"
          stroke="#DAAD51"
          strokeWidth={5}
        />
        <Circle
          cx={0}
          cy={35}
          r={42}
          fill={`url(#${id}-gold)`}
          stroke="#C8943E"
          strokeWidth={3}
        />
        <Circle
          cx={0}
          cy={35}
          r={33}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.8}
          strokeWidth={2}
        />
        {opened ? (
          <ResultMark x={0} y={35} resultKind={resultKind} size={21} />
        ) : (
          <G>
            <Path
              d="M-19 29H19V38H-19ZM-3 34L-12 53L-2 56L7 37L16 52L24 47L10 29"
              fill={navy}
            />
          </G>
        )}
        <Path
          d="M-29 23Q-22 11-10 8"
          stroke="#FFFFFF"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.8}
        />
      </G>
      {lifted && (
        <G>
          <Star x={76} y={78} size={10} />
          <Star x={227} y={108} size={7} color="#9B89E9" />
        </G>
      )}
    </G>
  );
}

function TigerScene({
  stage,
  progress,
  resultKind,
  id,
}: LuckySceneProps & { id: string }) {
  const opened = stage === "reveal";
  const excited = stage === "active" || opened;
  const lift = stage === "active" ? Math.min(1, Math.max(0, progress)) * 9 : 0;
  return (
    <G>
      <Ellipse cx={150} cy={246} rx={87} ry={9} fill="#DDE3F6" />
      <Ellipse
        cx={119}
        cy={237}
        rx={25}
        ry={11}
        fill="#F6B75E"
        stroke={navy}
        strokeWidth={2}
      />
      <Ellipse
        cx={181}
        cy={237}
        rx={25}
        ry={11}
        fill="#F6B75E"
        stroke={navy}
        strokeWidth={2}
      />
      <Path
        d="M200 212Q238 213 221 185"
        fill="none"
        stroke={navy}
        strokeWidth={15}
        strokeLinecap="round"
      />
      <Path
        d="M200 212Q238 213 221 185"
        fill="none"
        stroke="#F6B75E"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <Path
        d="M111 130H189L213 158L199 178L189 168V232H111V168L101 178L87 158Z"
        fill={`url(#${id}-cloth)`}
        stroke={navy}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path
        d="M125 132L150 161L175 132M140 133L160 156"
        fill="none"
        stroke={navy}
        strokeWidth={6}
      />
      <Path
        d="M111 183H189V195H111ZM147 189L135 219L145 223L156 193L167 219L178 213L162 187"
        fill={navy}
      />
      <Circle
        cx={106}
        cy={50}
        r={22}
        fill="#F6B75E"
        stroke={navy}
        strokeWidth={2.5}
      />
      <Circle
        cx={194}
        cy={50}
        r={22}
        fill="#F6B75E"
        stroke={navy}
        strokeWidth={2.5}
      />
      <Circle cx={106} cy={50} r={12} fill="#F7D6C5" />
      <Circle cx={194} cy={50} r={12} fill="#F7D6C5" />
      <Ellipse
        cx={150}
        cy={87}
        rx={59}
        ry={55}
        fill="#F6B75E"
        stroke={navy}
        strokeWidth={2.5}
      />
      <Path
        d="M139 35L145 55L150 43L156 56L162 35M94 73L112 81L95 85M205 73L188 81L205 85M94 96L112 98L99 108M206 96L188 98L201 108"
        fill={navy}
      />
      <Ellipse cx={135} cy={111} rx={22} ry={19} fill="#FFF8E9" />
      <Ellipse cx={165} cy={111} rx={22} ry={19} fill="#FFF8E9" />
      {excited ? (
        <G>
          <Path
            d="M116 86Q125 74 133 86M167 86Q176 74 184 86"
            stroke={navy}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M137 112Q150 137 163 112Z" fill={navy} />
          <Path d="M143 122Q150 115 157 122" fill="#F68F85" />
        </G>
      ) : (
        <G>
          <Ellipse cx={125} cy={86} rx={5} ry={7} fill={navy} />
          <Ellipse cx={175} cy={86} rx={5} ry={7} fill={navy} />
          <Path
            d="M137 115Q143 122 150 114Q157 122 163 115"
            stroke={navy}
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      )}
      <Path d="M143 102Q150 98 157 102L150 110Z" fill={navy} />
      <Path
        d="M112 108L97 106M113 114L98 118M188 108L203 106M187 114L202 118"
        stroke={navy}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Ellipse cx={106} cy={100} rx={7} ry={4} fill="#F68F85" opacity={0.6} />
      <Ellipse cx={194} cy={100} rx={7} ry={4} fill="#F68F85" opacity={0.6} />
      <G transform={`translate(0,${-lift})`}>
        <Path
          d="M130 179L123 160Q150 169 177 160L170 179Q199 209 178 228Q150 246 122 228Q101 209 130 179Z"
          fill="#F26B61"
          stroke={navy}
          strokeWidth={2.5}
        />
        <Path
          d="M131 180Q150 187 169 180"
          stroke="#FFDA75"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M149 182Q135 166 132 179Q137 185 149 182Q162 165 167 179Q162 186 149 182M149 182L141 204M149 182L159 204"
          stroke="#FFDA75"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
        {opened && (
          <G>
            <Ellipse cx={150} cy={166} rx={20} ry={7} fill={navy} />
            <Rect
              x={132}
              y={145}
              width={36}
              height={35}
              rx={6}
              fill="#FFEDB8"
              stroke="#D6A647"
              strokeWidth={1.5}
            />
            <ResultMark x={150} y={161} resultKind={resultKind} size={11} />
          </G>
        )}
        <Circle cx={150} cy={213} r={13} fill="#FFDA75" />
        <Star x={150} y={213} size={8} color={navy} />
        <Ellipse
          cx={112}
          cy={183}
          rx={17}
          ry={13}
          fill="#F6B75E"
          stroke={navy}
          strokeWidth={2}
          transform="rotate(-25,112,183)"
        />
        <Ellipse
          cx={188}
          cy={183}
          rx={17}
          ry={13}
          fill="#F6B75E"
          stroke={navy}
          strokeWidth={2}
          transform="rotate(25,188,183)"
        />
      </G>
    </G>
  );
}

function RotatingScene({
  selected,
  stage,
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
        stroke="#DDE3F6"
        strokeWidth={31}
      />
      <Circle
        cx={150}
        cy={130}
        r={85}
        fill="none"
        stroke="#AAB6D6"
        strokeWidth={2}
        strokeDasharray="4 8"
      />
      {Array.from({ length: 5 }, (_, index) => {
        const angle = (index * Math.PI * 2) / 5 - Math.PI / 2;
        const x = 150 + Math.cos(angle) * 85;
        const y = 130 + Math.sin(angle) * 85;
        const chosen = selected === index;
        return (
          <G
            key={index}
            transform={`translate(${x},${y}) rotate(${index * 72})`}
          >
            <Rect
              x={-30}
              y={-23}
              width={60}
              height={46}
              rx={7}
              fill="#B88C5E"
            />
            <Rect
              x={-30}
              y={-27}
              width={60}
              height={46}
              rx={7}
              fill={`url(#${id}-wood)`}
              stroke={chosen ? "#6877DE" : "#AF7F50"}
              strokeWidth={chosen ? 4 : 1.5}
            />
            <Path
              d="M-24-18H24M-24-11Q0-5 24-11M-24 9Q0 3 24 9"
              stroke="#CFA879"
              strokeWidth={1.5}
              fill="none"
            />
            <Rect
              x={-32}
              y={-5}
              width={64}
              height={7}
              rx={2}
              fill={beltColors[index]}
            />
            {chosen && stage === "reveal" ? (
              <G>
                <Circle cx={0} cy={-3} r={14} fill="#FFFFFF" />
                <ResultMark x={0} y={-3} resultKind={resultKind} size={10} />
              </G>
            ) : (
              <NumberBadge x={0} y={-3} value={index + 1} />
            )}
          </G>
        );
      })}
      <Circle
        cx={150}
        cy={130}
        r={37}
        fill="#FFFFFF"
        stroke={navy}
        strokeWidth={3}
      />
      <Path
        d="M132 126A19 19 0 0 1 166 119L172 112V131H153L160 124A10 10 0 0 0 140 127M168 136A19 19 0 0 1 134 143L128 150V131H147L140 138A10 10 0 0 0 160 135"
        fill={navy}
      />
    </G>
  );
}

/** Decorative scene only: actions, accessible labels and animation live in LuckyExperience. */
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
        <LinearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#EFFAFF" />
          <Stop offset="1" stopColor="#C1D2F1" />
        </LinearGradient>
        <LinearGradient id={`${id}-cloth`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E7ECFA" />
        </LinearGradient>
        <LinearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#F9E6B8" />
          <Stop offset=".5" stopColor="#FFF7DF" />
          <Stop offset="1" stopColor="#F1D498" />
        </LinearGradient>
        <LinearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFF0A8" />
          <Stop offset=".5" stopColor="#FFD56D" />
          <Stop offset="1" stopColor="#E5AA43" />
        </LinearGradient>
        <LinearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F2DCB7" />
          <Stop offset="1" stopColor="#D8B484" />
        </LinearGradient>
      </Defs>
      {props.mode === "capsule" && <CapsuleScene {...props} id={id} />}
      {props.mode === "roulette" && <RouletteScene {...props} />}
      {props.mode === "mitts" && <MittsScene {...props} />}
      {props.mode === "lockers" && <LockersScene {...props} />}
      {props.mode === "scrolls" && <ScrollsScene {...props} id={id} />}
      {props.mode === "uniforms" && <UniformsScene {...props} id={id} />}
      {props.mode === "medals" && <MedalsScene {...props} id={id} />}
      {props.mode === "tiger" && <TigerScene {...props} id={id} />}
      {props.mode === "rotating" && <RotatingScene {...props} id={id} />}
      {props.mode !== "roulette" && props.mode !== "rotating" && (
        <Confetti
          show={props.stage === "reveal" && props.resultKind !== "miss"}
        />
      )}
    </Svg>
  );
}
