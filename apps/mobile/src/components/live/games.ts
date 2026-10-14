import breaking from "../../../../../miniapps/live-games/generated/breaking";
export type LiveGameId =
  "breaking" | "freeze" | "initials" | "wordchain" | "memory";
export const gameSources: Partial<Record<LiveGameId, string>> = { breaking };
export function getGameSource(id: string): string | undefined {
  return gameSources[id as LiveGameId];
}
