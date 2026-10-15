import { build } from "esbuild";
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "../..");
const result = await build({
  entryPoints: [path.join(root, "src/app.js")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: "es2020",
  legalComments: "inline",
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = await readFile(path.join(root, "src/style.css"), "utf8");
const template = (await readFile(path.join(root, "src/index.html"), "utf8"))
  .replace("/*BREAKING_CSS*/", () => css)
  .replace("/*BREAKING_JS*/", () => js);
const dist = path.join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, "assets"), path.join(dist, "assets"), {
  recursive: true,
});
await writeFile(
  path.join(dist, "index.html"),
  template.replace(
    "/*BREAKING_CONFIG*/",
    "window.__BREAKING__={native:false};",
  ),
);
const assets = {};
const models = JSON.parse(
  await readFile(path.join(root, "assets/models.json"), "utf8"),
);
for (const m of models)
  assets[`assets/models/${m.id}.glb`] =
    "data:model/gltf-binary;base64," +
    (await readFile(path.join(root, `assets/models/${m.id}.glb`))).toString(
      "base64",
    );
for (const [name, mime] of [
  ["dojo.jpg", "image/jpeg"],
  ["logo.png", "image/png"],
])
  assets[`assets/${name}`] =
    `data:${mime};base64,` +
    (await readFile(path.join(root, `assets/${name}`))).toString("base64");
const native = template
  .replace(
    "/*BREAKING_CONFIG*/",
    () =>
      `window.__BREAKING__={native:true,storage:"__INITIAL_BREAKING_STATE__",assets:${JSON.stringify(assets)}};`,
  )
  .replace('src="assets/logo.png"', "");
await mkdir(path.join(root, "generated"), { recursive: true });
await writeFile(path.join(root, "generated/board-break.html"), native);
await rm(path.join(repo, "apps/mobile/public/board-break"), {
  recursive: true,
  force: true,
});
await mkdir(path.join(repo, "apps/mobile/public/board-break"), {
  recursive: true,
});
await cp(dist, path.join(repo, "apps/mobile/public/board-break"), {
  recursive: true,
});
await cp(
  path.join(root, "assets/logo.png"),
  path.join(repo, "apps/mobile/assets/board-break-icon.png"),
);
console.log(
  `Board break built: 12 GLBs, ${(Buffer.byteLength(native) / 1048576).toFixed(1)} MB offline HTML.`,
);
