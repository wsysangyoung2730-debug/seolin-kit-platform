import type { LuckyModeId } from "../../tools/lucky-draw";

/** Shared by the picker and gameplay so both show the same generated props. */
export const luckyAssets: Record<LuckyModeId, number> = {
  capsule: require("../../../assets/lucky/capsule.png"),
  roulette: require("../../../assets/lucky/roulette.png"),
  mitts: require("../../../assets/lucky/mitts.png"),
  lockers: require("../../../assets/lucky/lockers.png"),
  scrolls: require("../../../assets/lucky/scrolls.png"),
  uniforms: require("../../../assets/lucky/uniforms.png"),
  medals: require("../../../assets/lucky/medals.png"),
  tiger: require("../../../assets/lucky/tiger.png"),
  rotating: require("../../../assets/lucky/rotating.png"),
};
