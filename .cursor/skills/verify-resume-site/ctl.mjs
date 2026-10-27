#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(skillDir, "../../..");
const evidenceRoot = path.join(repoRoot, "verify-evidence");
const instancePath = path.join(evidenceRoot, "instance.json");
const heading = "Mike Morse";
const sentence = "This page is a placeholder. The resume is not published yet.";

const featureChecks = {
  "placeholder-page": ["heading", "sentence", "title"],
  stylesheet: ["stylesheet", "color", "font", "width"],
  "project-path": ["project-path", "heading"],
};

function chromePath() {
  return process.env.CHROME_PATH || "/usr/bin/google-chrome";
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

async function readInstance() {
  try {
    return JSON.parse(await readFile(instancePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function serverNotListening(error) {
  const code = error?.cause?.code ?? error?.code;
  return code === "ECONNREFUSED" || code === "ECONNRESET";
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function freePort(start) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolve(freePort(start + 1));
        return;
      }
      reject(error);
    });
    server.listen(start, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
}

async function waitForReady(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      const body = await response.text();
      if (
        response.status === 200 &&
        body.includes(heading) &&
        body.includes(sentence)
      ) {
        return;
      }
    } catch (error) {
      if (!serverNotListening(error)) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`page was not ready at ${url}`);
}

async function launch() {
  const existing = await readInstance();
  if (existing && pidAlive(existing.pid)) {
    fail(`instance already running at ${existing.url} pid ${existing.pid}`);
    return;
  }

  if (!process.version.startsWith("v22.")) {
    fail(`Node ${process.version} does not match .nvmrc 22`);
    return;
  }

  if (run("npm", ["ci"]) !== 0 || run("npm", ["run", "build"]) !== 0) {
    fail("npm ci or npm run build failed");
    return;
  }

  const port = await freePort(4173);
  const runDir = path.join(
    tmpdir(),
    `resume-site-${Date.now()}-${process.pid}`,
  );
  const siteDir = path.join(runDir, "resume-site");
  await mkdir(siteDir, { recursive: true });
  await cp(path.join(repoRoot, "dist"), siteDir, { recursive: true });

  const child = spawn(
    "python3",
    [
      "-m",
      "http.server",
      String(port),
      "--bind",
      "127.0.0.1",
      "--directory",
      runDir,
    ],
    { detached: true, stdio: "ignore" },
  );
  child.unref();

  const url = `http://127.0.0.1:${port}/resume-site/`;
  const instance = {
    pid: child.pid,
    port,
    url,
    runDir,
    chromePath: chromePath(),
  };
  await mkdir(evidenceRoot, { recursive: true });
  await writeFile(instancePath, `${JSON.stringify(instance, null, 2)}\n`);

  try {
    await waitForReady(url);
  } catch (error) {
    process.kill(child.pid, "SIGTERM");
    await rm(runDir, { recursive: true, force: true });
    await rm(instancePath, { force: true });
    throw error;
  }

  process.stdout.write(`ready ${url}\n`);
}

async function doctor() {
  const instance = await readInstance();
  if (!instance) {
    fail("no instance. run launch first");
    return;
  }
  if (!pidAlive(instance.pid)) {
    fail(`pid ${instance.pid} is not running`);
    return;
  }
  if (!process.version.startsWith("v22.")) {
    fail(`Node ${process.version} does not match .nvmrc 22`);
    return;
  }
  try {
    await access(instance.chromePath || chromePath());
  } catch {
    fail(`chrome is missing at ${instance.chromePath || chromePath()}`);
    return;
  }

  const response = await fetch(instance.url);
  const body = await response.text();
  if (response.status !== 200) {
    fail(`${instance.url} returned ${response.status}`);
    return;
  }
  if (!body.includes(sentence)) {
    fail("response body is missing the placeholder sentence");
    return;
  }
  process.stdout.write(`doctor ok ${instance.url}\n`);
}

function unmet(feature, snapshot) {
  const { observed } = snapshot;
  const problems = [];
  const checks = featureChecks[feature];
  if (checks.includes("heading") && observed.h1 !== heading) {
    problems.push(`heading ${JSON.stringify(observed.h1)}`);
  }
  if (checks.includes("sentence") && observed.paragraph !== sentence) {
    problems.push(`paragraph ${JSON.stringify(observed.paragraph)}`);
  }
  if (checks.includes("title") && observed.title !== heading) {
    problems.push(`title ${JSON.stringify(observed.title)}`);
  }
  if (checks.includes("stylesheet")) {
    if (observed.stylesheetHref !== "styles.css") {
      problems.push(`href ${JSON.stringify(observed.stylesheetHref)}`);
    }
    if (snapshot.stylesheetStatus !== 200) {
      problems.push(`stylesheet status ${snapshot.stylesheetStatus}`);
    }
  }
  if (checks.includes("color")) {
    if (observed.color !== "rgb(34, 34, 34)") {
      problems.push(`color ${observed.color}`);
    }
    if (observed.background !== "rgb(255, 255, 255)") {
      problems.push(`background ${observed.background}`);
    }
  }
  if (checks.includes("font") && !observed.fontFamily.includes("system-ui")) {
    problems.push(`font ${observed.fontFamily}`);
  }
  if (checks.includes("width") && observed.maxWidth === "none") {
    problems.push("max-width is none");
  }
  if (checks.includes("project-path")) {
    const pathname = new URL(observed.pageUrl).pathname;
    if (
      pathname !== "/resume-site/" &&
      pathname !== "/resume-site/index.html"
    ) {
      problems.push(`pathname ${pathname}`);
    }
    if (!observed.stylesheetAbsolute?.endsWith("/resume-site/styles.css")) {
      problems.push(`stylesheet url ${observed.stylesheetAbsolute}`);
    }
  }
  if (snapshot.navigationStatus !== 200) {
    problems.push(`navigation ${snapshot.navigationStatus}`);
  }
  return problems;
}

function sendCommand(socket, pending, method, params = {}, sessionId) {
  const id = pending.nextId;
  pending.nextId += 1;
  const payload = { id, method, params };
  if (sessionId) {
    payload.sessionId = sessionId;
  }
  socket.send(JSON.stringify(payload));
  return new Promise((resolve, reject) => {
    pending.waiters.set(id, { resolve, reject });
  });
}

async function removeDir(dir) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await rm(dir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error.code !== "ENOTEMPTY" && error.code !== "EBUSY") {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  await rm(dir, { recursive: true, force: true });
}

async function capturePage(url, chromeBin, screenshot) {
  const userData = await mkdtemp(path.join(tmpdir(), "verify-chrome-"));
  const chrome = spawn(
    chromeBin,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--user-data-dir=${userData}`,
      "--remote-debugging-port=0",
      "--window-size=1280,800",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  try {
    const debugPort = await new Promise((resolve, reject) => {
      let text = "";
      const timer = setTimeout(
        () => reject(new Error("chrome did not open a debug port")),
        10000,
      );
      chrome.stderr.on("data", (chunk) => {
        text += chunk.toString();
        const match = text.match(
          /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//,
        );
        if (match) {
          clearTimeout(timer);
          resolve(Number(match[1]));
        }
      });
      chrome.once("exit", () => {
        clearTimeout(timer);
        reject(new Error("chrome exited before opening a debug port"));
      });
    });
    const version = await fetch(
      `http://127.0.0.1:${debugPort}/json/version`,
    ).then((response) => response.json());
    const socket = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener(
        "error",
        () => reject(new Error("chrome websocket failed")),
        { once: true },
      );
    });
    const pending = { nextId: 1, waiters: new Map() };
    const network = [];
    let sessionId = null;
    let loadSeen = null;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.waiters.has(message.id)) {
        const waiter = pending.waiters.get(message.id);
        pending.waiters.delete(message.id);
        if (message.error) {
          waiter.reject(new Error(JSON.stringify(message.error)));
        } else {
          waiter.resolve(message.result);
        }
        return;
      }
      if (
        message.method === "Network.responseReceived" &&
        message.sessionId === sessionId
      ) {
        network.push(message.params);
      }
      if (
        message.method === "Page.loadEventFired" &&
        message.sessionId === sessionId &&
        loadSeen
      ) {
        loadSeen();
      }
    });

    const created = await sendCommand(socket, pending, "Target.createTarget", {
      url: "about:blank",
    });
    const attached = await sendCommand(
      socket,
      pending,
      "Target.attachToTarget",
      { targetId: created.targetId, flatten: true },
    );
    sessionId = attached.sessionId;
    await sendCommand(socket, pending, "Page.enable", {}, sessionId);
    await sendCommand(socket, pending, "Network.enable", {}, sessionId);
    await sendCommand(socket, pending, "Runtime.enable", {}, sessionId);
    const loaded = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`load timed out for ${url}`)),
        15000,
      );
      loadSeen = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    await sendCommand(socket, pending, "Page.navigate", { url }, sessionId);
    await loaded;
    const evaluated = await sendCommand(
      socket,
      pending,
      "Runtime.evaluate",
      {
        expression: `(() => {
          const link = document.querySelector('link[rel="stylesheet"]');
          const root = getComputedStyle(document.documentElement);
          const body = getComputedStyle(document.body);
          return {
            title: document.title,
            h1: document.querySelector("h1")?.textContent ?? null,
            paragraph: document.querySelector("main p")?.textContent ?? null,
            stylesheetHref: link?.getAttribute("href") ?? null,
            stylesheetAbsolute: link?.href ?? null,
            color: root.color,
            background: root.backgroundColor,
            fontFamily: body.fontFamily,
            maxWidth: body.maxWidth,
            pageUrl: location.href,
          };
        })()`,
        returnByValue: true,
      },
      sessionId,
    );
    const shot = await sendCommand(
      socket,
      pending,
      "Page.captureScreenshot",
      { format: "png", captureBeyondViewport: true },
      sessionId,
    );
    await writeFile(screenshot, Buffer.from(shot.data, "base64"));
    socket.close();
    const documentResponse = network.find(
      (item) =>
        item.type === "Document" &&
        item.response?.url?.includes("/resume-site/"),
    );
    const stylesheet = network.find((item) =>
      item.response?.url?.endsWith("/styles.css"),
    );
    return {
      navigationStatus: documentResponse?.response?.status ?? null,
      observed: evaluated.result.value,
      stylesheetStatus: stylesheet?.response?.status ?? null,
      stylesheetUrl: stylesheet?.response?.url ?? null,
    };
  } finally {
    if (pidAlive(chrome.pid)) {
      chrome.kill("SIGTERM");
    }
    await new Promise((resolve) => {
      if (chrome.exitCode !== null || chrome.signalCode !== null) {
        resolve();
        return;
      }
      chrome.once("exit", resolve);
    });
    await removeDir(userData);
  }
}

async function drive(feature) {
  if (!Object.hasOwn(featureChecks, feature)) {
    fail(`unknown feature ${feature}`);
    return;
  }
  const instance = await readInstance();
  if (!instance || !pidAlive(instance.pid)) {
    fail("no live instance. run launch, then doctor");
    return;
  }

  const featureDir = path.join(evidenceRoot, feature);
  await mkdir(featureDir, { recursive: true });
  const screenshot = path.join(featureDir, "page.png");
  const captured = await capturePage(
    instance.url,
    instance.chromePath || chromePath(),
    screenshot,
  );
  const snapshot = {
    feature,
    url: instance.url,
    screenshot,
    ...captured,
  };
  const problems = unmet(feature, snapshot);
  snapshot.problems = problems;
  await writeFile(
    path.join(featureDir, "result.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`,
  );
  if (problems.length > 0) {
    fail(problems.join("; "));
    return;
  }
  process.stdout.write(`drive ${feature} ok ${screenshot}\n`);
}

async function cleanup() {
  const instance = await readInstance();
  if (!instance) {
    process.stdout.write("cleanup ok no instance\n");
    return;
  }
  if (pidAlive(instance.pid)) {
    process.kill(instance.pid, "SIGTERM");
  }
  if (instance.runDir.startsWith(tmpdir() + path.sep)) {
    await rm(instance.runDir, { recursive: true, force: true });
  }
  await rm(instancePath, { force: true });
  process.stdout.write("cleanup ok evidence kept in verify-evidence/\n");
}

const [command, feature] = process.argv.slice(2);
if (command === "launch") {
  await launch();
} else if (command === "doctor") {
  await doctor();
} else if (command === "drive") {
  await drive(feature);
} else if (command === "cleanup") {
  await cleanup();
} else {
  fail("usage: ctl.mjs launch | doctor | drive <feature> | cleanup");
}
