import { describe, it, expect } from "vitest";
import { runInNewContext, Script } from "node:vm";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import bootstrap from "./generated/bootstrap";
import { buildGameDocument } from "../../apps/mobile/src/components/live/document";
function environment() {
  const messages: Record<string, unknown>[] = [];
  const stopped: string[] = [];
  const listeners: Record<string, () => void> = {};
  let resolveMedia: (stream: unknown) => void = () => {};
  const window: Record<string, any> = {
    ReactNativeWebView: {
      postMessage: (text: string) => messages.push(JSON.parse(text)),
    },
  };
  const document = {
    addEventListener: () => {},
    querySelectorAll: () => [],
    getElementById: () => null,
  };
  const ctx = {
    window,
    document,
    navigator: {
      mediaDevices: {
        getUserMedia: () =>
          new Promise((resolve) => {
            resolveMedia = resolve;
          }),
      },
    },
    addEventListener: (name: string, fn: () => void) => {
      listeners[name] = fn;
    },
    DOMException,
    Event,
    setTimeout,
  };
  const run = (camera = true, voice = true) =>
    runInNewContext(
      `(${bootstrap})(${JSON.stringify({ native: true, camera, voice, storage: { "slg-step": "1" } })})`,
      ctx,
    );
  return {
    window,
    messages,
    stopped,
    ctx,
    run,
    resolve: () =>
      resolveMedia({
        getTracks: () => [{ stop: () => stopped.push("stopped") }],
      }),
  };
}
describe("miniapp bridge lifecycle", () => {
  it("does not open camera when disabled", async () => {
    const e = environment();
    e.run(false, false);
    await expect(
      e.ctx.navigator.mediaDevices.getUserMedia({ video: true } as never),
    ).rejects.toThrow();
    expect(e.window.SpeechRecognition).toBeUndefined();
  });
  it("stops a camera permission result that arrives after exit", async () => {
    const e = environment();
    e.run();
    const pending = e.ctx.navigator.mediaDevices.getUserMedia({
      video: true,
    } as never);
    e.window.__seolinDispose();
    e.resolve();
    await expect(pending).rejects.toThrow();
    expect(e.stopped).toEqual(["stopped"]);
  });
  it("preserves speech finality and allows restarting after an end event", () => {
    const e = environment();
    e.run();
    const rec = new e.window.SpeechRecognition();
    let result: any;
    rec.onresult = (event: any) => {
      result = event;
    };
    rec.start();
    e.window.__seolinSpeech("result", { text: "사과", final: true });
    expect(result.results[0][0].transcript).toBe("사과");
    expect(result.results[0].isFinal).toBe(true);
    e.window.__seolinSpeech("end", {});
    expect(() => rec.start()).not.toThrow();
  });
  it("keeps shared team data across game changes", () => {
    const e = environment();
    e.run();
    e.window.localStorage.setItem("slg-teams", '[{"name":"청팀","score":4}]');
    expect(e.messages.at(-1)).toMatchObject({
      type: "storage",
      data: { "slg-step": "1", "slg-teams": '[{"name":"청팀","score":4}]' },
    });
  });
});
it("preserves every bundled original byte and compiles every assembled script", () => {
  const root = new URL("./", import.meta.url);
  const hashes = JSON.parse(
    readFileSync(new URL("source-hashes.json", root), "utf8"),
  );
  for (const file of readdirSync(new URL("sources/", root)).filter((file) =>
    file.endsWith(".html"),
  )) {
    const source = readFileSync(new URL("sources/" + file, root), "utf8");
    expect(createHash("sha256").update(source).digest("hex")).toBe(
      hashes[file],
    );
    const html = buildGameDocument(source, {
      native: true,
      camera: true,
      voice: true,
      storage: {},
    });
    for (const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi))
      expect(() => new Script(match[1]!)).not.toThrow();
  }
});
