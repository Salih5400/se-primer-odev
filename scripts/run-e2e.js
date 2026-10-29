import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;
const children = [];

function start(args, label) {
  const child = spawn(node, args, { cwd: root, stdio: "inherit", env: process.env });
  children.push(child);
  child.on("error", (error) => console.error(`${label} could not start:`, error.message));
  return child;
}

function waitForExit(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve(child.exitCode ?? 1);
    child.once("exit", (code) => resolve(code ?? 1));
    child.once("error", () => resolve(1));
  });
}

async function waitForServers(apiServer, webServer) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (apiServer.exitCode !== null) throw new Error("Tutor API sunucusu erken kapandı.");
    if (webServer.exitCode !== null) throw new Error("Vite sunucusu erken kapandı.");
    try {
      const [web, api] = await Promise.all([
        fetch("http://127.0.0.1:5173"),
        fetch("http://127.0.0.1:8787/api/health"),
      ]);
      if (web.ok && api.ok) return;
    } catch {
      // Vite henüz hazır değil; sonraki denemede tekrar kontrol et.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Vite sunucusu 30 saniye içinde hazır olmadı.");
}

try {
  const apiServer = start([path.join(root, "server/index.js")], "Tutor API");
  const webServer = start([path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--strictPort"], "Vite");
  await waitForServers(apiServer, webServer);

  const cypress = start([path.join(root, "node_modules/cypress/bin/cypress"), "run"], "Cypress");
  const exitCode = await waitForExit(cypress);
  process.exitCode = exitCode;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  for (const child of children.reverse()) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
}
