import breaking from "../../../../../miniapps/live-games/generated/breaking";
import freeze from "../../../../../miniapps/live-games/generated/freeze";
export type LiveGameId =
  "breaking" | "freeze" | "initials" | "wordchain" | "memory";
export const gameSources: Partial<Record<LiveGameId, string>> = {
  breaking,
  freeze,
};
export function getGameSource(id: string): string | undefined {
  return gameSources[id as LiveGameId];
}
