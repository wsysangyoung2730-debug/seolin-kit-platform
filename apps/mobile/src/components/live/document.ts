import bootstrap from "../../../../../miniapps/live-games/generated/bootstrap";
import score from "../../../../../miniapps/live-games/generated/score";
import theme from "../../../../../miniapps/live-games/generated/theme";
import type { StoredGameData } from "./protocol";
export interface GameOptions {
  native: boolean;
  camera: boolean;
  voice: boolean;
  storage: StoredGameData;
}
export function buildGameDocument(
  source: string,
  options: GameOptions,
): string {
  const escapeScript = (value: string) =>
    value.replace(/<\/script/gi, "<\\/script");
  const config = JSON.stringify(options).replace(/</g, "\\u003c");
  const setup = `<script>(${bootstrap})(${config})</script>`;
  // All assets/dictionaries/audio are bundled; remove optional remote typography.
  let html = source.replace(
    /<link\b[^>]*href=["']https:\/\/fonts\.[^>]*>/gi,
    "",
  );
  html = html.replace(
    /parent\.location\.hash\s*=\s*''/g,
    "window.dispatchEvent(new Event('seolin-exit'))",
  );
  html = html.replace(
    /<head>/i,
    `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; connect-src 'none'; font-src data:">${setup}`,
  );
  html = html.replace(/<\/head>/i, `<style>${theme}</style></head>`);
  const shared = score.replace(
    /parent\.location\.hash\s*=\s*''/g,
    "window.dispatchEvent(new Event('seolin-exit'))",
  );
  return html.replace(
    /<\/body>/i,
    `<script>${escapeScript(shared)}</script></body>`,
  );
}
