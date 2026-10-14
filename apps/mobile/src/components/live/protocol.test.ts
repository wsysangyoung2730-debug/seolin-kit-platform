import { describe, expect, it } from "vitest";
import { parseBridgeMessage, decodeGameStorage } from "./protocol";
import { buildGameDocument } from "./document";
describe("trusted miniapp boundary", () => {
  it("rejects malformed messages and arbitrary storage keys", () => {
    for (const data of [
      "{",
      "null",
      '{"type":"exit"}',
      '{"seolin":1,"type":"storage","data":{"token":"x"}}',
    ])
      expect(parseBridgeMessage(data)).toBeNull();
    expect(() => decodeGameStorage('{"slg-teams":123}')).toThrow();
    expect(
      parseBridgeMessage(
        JSON.stringify({
          seolin: 1,
          type: "storage",
          data: { "slg-step": "2" },
        }),
      ),
    ).toEqual({ type: "storage", data: { "slg-step": "2" } });
  });
  it("limits file target and spoken data before native access", () => {
    expect(
      parseBridgeMessage(
        JSON.stringify({
          seolin: 1,
          type: "files",
          id: "x);evil()",
          accept: "image/*",
          multiple: true,
        }),
      ),
    ).toBeNull();
    expect(
      parseBridgeMessage(
        JSON.stringify({ seolin: 1, type: "tts", text: "x".repeat(1001) }),
      ),
    ).toBeNull();
    expect(
      parseBridgeMessage(
        JSON.stringify({
          seolin: 1,
          type: "tts",
          text: "시작",
          rate: 100,
          pitch: -5,
        }),
      ),
    ).toMatchObject({ rate: 2, pitch: 0.5 });
  });
  it("escapes persisted strings without allowing script breakout", () => {
    const source =
      "<!doctype html><html><head></head><body><script>parent.location.hash = '';</script></body></html>";
    const html = buildGameDocument(source, {
      native: true,
      camera: false,
      voice: false,
      storage: { "slg-teams": "</script><script>evil()</script>" },
    });
    expect(html).not.toContain("<script>evil()");
    expect(html).toContain("\\u003c/script>");
    expect(html).toContain("window.dispatchEvent(new Event('seolin-exit'))");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("function slgScore()");
  });
});
