import "./build.mjs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const target = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!target.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(target);
    res
      .writeHead(200, {
        "Content-Type":
          mime[path.extname(target)] || "application/octet-stream",
      })
      .end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
server.listen(Number(process.env.PORT || 4174), "127.0.0.1", () =>
  console.log(`Board break: http://127.0.0.1:${server.address().port}`),
);
