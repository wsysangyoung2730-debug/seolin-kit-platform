import breaking from "../../../../../miniapps/live-games/generated/breaking";
import freeze from "../../../../../miniapps/live-games/generated/freeze";
import initials from "../../../../../miniapps/live-games/generated/initials";
import wordchain from "../../../../../miniapps/live-games/generated/wordchain";
export type LiveGameId =
  "breaking" | "freeze" | "initials" | "wordchain" | "memory";
export const gameSources: Partial<Record<LiveGameId, string>> = {
  breaking,
  freeze,
  initials,
  wordchain,
};
export function getGameSource(id: string): string | undefined {
  return gameSources[id as LiveGameId];
}
