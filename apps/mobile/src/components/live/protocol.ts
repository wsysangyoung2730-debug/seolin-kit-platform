export type StoredGameData = Record<string, string>;
const allowedKey = /^(slg-|wc-|ox-|gyeokpa-|mugunghwa-|chosung-|memory-)/;
export function decodeGameStorage(raw: string | null): StoredGameData {
  if (raw === null) return {};
  if (raw.length > 1_000_000) throw new Error("저장 데이터가 너무 커요.");
  const data: unknown = JSON.parse(raw);
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.entries(data).some(
      ([key, value]) => !allowedKey.test(key) || typeof value !== "string",
    )
  )
    throw new Error("저장 형식을 확인해 주세요.");
  return data as StoredGameData;
}
export type BridgeMessage =
  | { type: "exit" | "ready" | "speech-start" | "speech-stop" | "tts-stop" }
  | { type: "storage"; data: StoredGameData }
  | { type: "tts"; text: string; rate: number; pitch: number }
  | { type: "files"; id: string; accept: string; multiple: boolean };
export function parseBridgeMessage(raw: string): BridgeMessage | null {
  if (raw.length > 1_100_000) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || value.seolin !== 1) return null;
    if (
      ["exit", "ready", "speech-start", "speech-stop", "tts-stop"].includes(
        value.type,
      )
    )
      return { type: value.type };
    if (value.type === "storage")
      return {
        type: "storage",
        data: decodeGameStorage(JSON.stringify(value.data)),
      };
    if (
      value.type === "tts" &&
      typeof value.text === "string" &&
      value.text.length <= 1000
    )
      return {
        type: "tts",
        text: value.text,
        rate: Math.max(0.5, Math.min(2, Number(value.rate) || 1)),
        pitch: Math.max(0.5, Math.min(2, Number(value.pitch) || 1)),
      };
    if (
      value.type === "files" &&
      typeof value.id === "string" &&
      /^[\w-]{1,80}$/.test(value.id) &&
      typeof value.accept === "string" &&
      typeof value.multiple === "boolean"
    )
      return {
        type: "files",
        id: value.id,
        accept: value.accept,
        multiple: value.multiple,
      };
  } catch {
    /* Invalid page messages never reach native capabilities. */
  }
  return null;
}
