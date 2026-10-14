export type LiveGameId =
  "breaking" | "freeze" | "initials" | "wordchain" | "memory";
export const gameSources: Partial<Record<LiveGameId, string>> = {};
export function getGameSource(id: string): string | undefined {
  return gameSources[id as LiveGameId];
}
