import http from "node:http";
import fs from "node:fs";
import path from "node:path";

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
    return "application/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".glb")) return "model/gltf-binary";
  return "application/octet-stream";
}

export async function startStaticServer(root, preferredPort = 0) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const target = path.join(root, urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, ""));
    if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    res.setHeader("Content-Type", contentType(target));
    fs.createReadStream(target).pipe(res);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(preferredPort, resolve);
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : preferredPort;
  return {
    port,
    url: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
