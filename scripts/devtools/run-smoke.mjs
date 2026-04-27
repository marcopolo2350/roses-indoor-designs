import { spawn } from "node:child_process";
import { startStaticServer } from "./static-server.mjs";

const root = process.cwd();
const server = await startStaticServer(root);

const child = spawn(
  process.execPath,
  [
    "./web_game_playwright_client.js",
    "--url",
    `${server.url}/index.html`,
    "--click-selector",
    ".w-btn",
    "--click",
    "24,24",
    "--iterations",
    "1",
    "--pause-ms",
    "300",
    "--screenshot-dir",
    "output/web-game-smoke",
  ],
  {
    cwd: root,
    stdio: "inherit",
  },
);

const exitCode = await new Promise((resolve) => child.on("exit", resolve));
await server.close();

if (exitCode !== 0) {
  process.exit(exitCode || 1);
}
