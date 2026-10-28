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
import { rules as privacyRules } from "../../../scripts/privacy-rules.mjs";

const skillDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(skillDir, "../../..");
const evidenceRoot = path.join(repoRoot, "verify-evidence");
const instancePath = path.join(evidenceRoot, "instance.json");
const heading = "Michael Morse";
const locationLine = "Framingham, MA";
const signalMark = "Marketing Technology Specialist";
const sections = [
  "Summary",
  "Experience",
  "Military",
  "Education",
  "Skills",
  "Certifications",
];
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

const viewports = {
  "resume-page": { width: 1280, height: 800, mobile: false },
  "mobile-layout": { width: 390, height: 844, mobile: true },
  "site-links": { width: 1280, height: 800, mobile: false },
  "contact-privacy": { width: 1280, height: 800, mobile: false },
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

function commandOnPath(name) {
  const result = spawnSync(name, ["--version"], { stdio: "ignore" });
  return result.status === 0;
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
        body.includes(locationLine) &&
        body.includes(signalMark) &&
        body.includes('id="root"')
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
  if (!commandOnPath("python3")) {
    fail(
      "python3 is missing. launch serves the site with python3 -m http.server",
    );
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

async function serverCommand(pid) {
  try {
    const raw = await readFile(`/proc/${pid}/cmdline`);
    return raw.toString("utf8").replaceAll("\0", " ").trim();
  } catch {
    return "";
  }
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
  const command = await serverCommand(instance.pid);
  if (!command.includes("python3") || !command.includes("http.server")) {
    fail(`pid ${instance.pid} is not the python3 http.server this run started`);
    return;
  }
  if (!String(command).includes(String(instance.port))) {
    fail(`pid ${instance.pid} is not listening with port ${instance.port}`);
    return;
  }
  if (!process.version.startsWith("v22.")) {
    fail(`Node ${process.version} does not match .nvmrc 22`);
    return;
  }
  if (!commandOnPath("python3")) {
    fail(
      "python3 is missing. the recorded server was started with python3 -m http.server",
    );
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
  if (!body.includes(locationLine) || !body.includes(signalMark)) {
    fail("response body is not the built Signal resume");
    return;
  }
  if (!body.includes('id="root"')) {
    fail("response body is missing the built resume root");
    return;
  }
  process.stdout.write(`doctor ok ${instance.url}\n`);
}

function pageOrigin(pageUrl) {
  return new URL(pageUrl).origin;
}

function sameOriginPath(pageUrl, resourceUrl) {
  const page = new URL(pageUrl);
  const resource = new URL(resourceUrl);
  if (resource.origin !== page.origin) {
    return null;
  }
  return resource.pathname;
}

function cssUrls(css, base) {
  const found = [];
  const pattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  let match = pattern.exec(css);
  while (match !== null) {
    const raw = match[2].trim();
    if (!raw.startsWith("data:")) {
      found.push({ raw, url: new URL(raw, base).href });
    }
    match = pattern.exec(css);
  }
  return found;
}

function privacyFindings(text) {
  const findings = [];
  for (const rule of privacyRules) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) {
      findings.push(rule.id);
    }
  }
  if (emailPattern.test(text)) {
    findings.push("email-address");
  }
  return findings;
}

async function fetchStatus(url) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    return response.status;
  } catch (error) {
    return error.name === "TimeoutError" ? 0 : 0;
  }
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

const observeExpression = `(() => {
  const referenced = [];
  for (const el of document.querySelectorAll("[href], [src]")) {
    const attr = el.hasAttribute("href") ? "href" : "src";
    referenced.push({
      tag: el.tagName.toLowerCase(),
      raw: el.getAttribute(attr),
      url: el[attr] || null,
    });
  }
  const h1 = document.querySelector("h1");
  const page = document.querySelector(".page");
  const deck = document.querySelector(".deck");
  const deckMore = document.querySelector(".deck-more");
  const headshot = document.querySelector(".portrait img");
  const contact = document.querySelector(".contact");
  const link = document.querySelector('link[rel="stylesheet"]');
  const root = getComputedStyle(document.documentElement);
  const description =
    document.querySelector('meta[name="description"]')?.content ?? "";
  return {
    title: document.title,
    h1: h1?.textContent ?? null,
    h1FontSize: h1 ? getComputedStyle(h1).fontSize : null,
    location: document.querySelector(".copy .label")?.textContent ?? null,
    sections: [...document.querySelectorAll("h2")].map((node) =>
      node.textContent.trim(),
    ),
    signalMark: document.body.innerText.includes(${JSON.stringify(signalMark)}),
    stylesheetHref: link?.getAttribute("href") ?? null,
    stylesheetAbsolute: link?.href ?? null,
    color: root.color,
    background: root.backgroundColor,
    fontFamily: getComputedStyle(document.body).fontFamily,
    maxWidth: deck ? getComputedStyle(deck).maxWidth : null,
    pageUrl: location.href,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    gridTracks: page
      ? getComputedStyle(page).gridTemplateColumns.split(/\\s+/).filter(Boolean)
          .length
      : 0,
    deckMoreDisplay: deckMore ? getComputedStyle(deckMore).display : null,
    headshot: headshot
      ? {
          alt: headshot.alt,
          src: headshot.currentSrc || headshot.src,
          naturalWidth: headshot.naturalWidth,
        }
      : null,
    contact: contact
      ? { tag: contact.tagName, text: contact.textContent.trim() }
      : null,
    visibleText: [document.body.innerText, document.title, description].join(
      "\\n",
    ),
    referenced,
  };
})()`;

async function capturePage(url, chromeBin, screenshot, viewport) {
  const userData = await mkdtemp(path.join(tmpdir(), "verify-chrome-"));
  const chrome = spawn(
    chromeBin,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--user-data-dir=${userData}`,
      "--remote-debugging-port=0",
      `--window-size=${viewport.width},${viewport.height}`,
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
    await sendCommand(
      socket,
      pending,
      "Emulation.setDeviceMetricsOverride",
      {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
      },
      sessionId,
    );
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
    await sendCommand(
      socket,
      pending,
      "Runtime.evaluate",
      {
        expression: "document.fonts.ready.then(() => true)",
        awaitPromise: true,
      },
      sessionId,
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    const evaluated = await sendCommand(
      socket,
      pending,
      "Runtime.evaluate",
      { expression: observeExpression, returnByValue: true },
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
      network: network.map((item) => ({
        url: item.response?.url ?? null,
        status: item.response?.status ?? null,
        type: item.type ?? null,
        initiatorType: item.initiator?.type ?? null,
      })),
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

async function linkReport(snapshot) {
  const { observed } = snapshot;
  const pageUrl = observed.pageUrl;
  const resources = observed.referenced.map((item) => ({
    kind: "document",
    tag: item.tag,
    raw: item.raw,
    url: item.url,
  }));
  if (observed.stylesheetAbsolute) {
    const cssResponse = await fetch(observed.stylesheetAbsolute);
    const css = await cssResponse.text();
    for (const item of cssUrls(css, observed.stylesheetAbsolute)) {
      resources.push({
        kind: "stylesheet",
        tag: "css",
        raw: item.raw,
        url: item.url,
      });
    }
  }
  const browserStatus = new Map();
  for (const item of snapshot.network) {
    if (item.url) {
      browserStatus.set(item.url, item.status);
    }
  }
  const checked = [];
  for (const resource of resources) {
    const fromBrowser = browserStatus.get(resource.url);
    const status =
      typeof fromBrowser === "number"
        ? fromBrowser
        : await fetchStatus(resource.url);
    checked.push({
      ...resource,
      status,
      via: typeof fromBrowser === "number" ? "browser" : "fetch",
    });
  }
  return checked;
}

function requireResource(problems, links, predicate, label) {
  const match = links.find(predicate);
  if (!match) {
    problems.push(`missing ${label}`);
    return;
  }
  if (match.status < 200 || match.status >= 300) {
    problems.push(`${label} status ${match.status}`);
  }
}

function unmet(feature, snapshot, links, privacy) {
  const { observed } = snapshot;
  const problems = [];
  const viewport = viewports[feature];
  if (!observed) {
    problems.push("page observation missing");
    return problems;
  }
  if (snapshot.navigationStatus !== 200) {
    problems.push(`navigation ${snapshot.navigationStatus}`);
  }
  const pathname = observed.pageUrl ? new URL(observed.pageUrl).pathname : "";
  if (pathname !== "/resume-site/" && pathname !== "/resume-site/index.html") {
    problems.push(`pathname ${pathname}`);
  }
  if (observed.h1 !== heading) {
    problems.push(`heading ${JSON.stringify(observed.h1)}`);
  }
  if (observed.title !== heading) {
    problems.push(`title ${JSON.stringify(observed.title)}`);
  }
  if (observed.location !== locationLine) {
    problems.push(`location ${JSON.stringify(observed.location)}`);
  }
  if (observed.innerWidth !== viewport.width) {
    problems.push(`innerWidth ${observed.innerWidth}`);
  }

  if (feature === "resume-page") {
    if (!observed.signalMark) {
      problems.push("signal resume text missing");
    }
    const found = observed.sections ?? [];
    for (const section of sections) {
      if (!found.includes(section)) {
        problems.push(`section ${section}`);
      }
    }
    if (observed.stylesheetHref !== "styles.css") {
      problems.push(`href ${JSON.stringify(observed.stylesheetHref)}`);
    }
    if (snapshot.stylesheetStatus !== 200) {
      problems.push(`stylesheet status ${snapshot.stylesheetStatus}`);
    }
    if (observed.color !== "rgb(231, 238, 246)") {
      problems.push(`color ${observed.color}`);
    }
    if (observed.background !== "rgb(12, 18, 28)") {
      problems.push(`background ${observed.background}`);
    }
    if (!observed.fontFamily?.includes("Inter")) {
      problems.push(`font ${observed.fontFamily}`);
    }
    if (observed.maxWidth === "none" || observed.maxWidth == null) {
      problems.push("max-width is none");
    }
    if (observed.h1FontSize !== "64px") {
      problems.push(`h1 size ${observed.h1FontSize}`);
    }
    if (observed.gridTracks !== 2) {
      problems.push(`grid tracks ${observed.gridTracks}`);
    }
    if (observed.deckMoreDisplay === "none") {
      problems.push("deck continuation is hidden at desktop width");
    }
    if (!observed.headshot || observed.headshot.naturalWidth < 1) {
      problems.push("headshot did not load");
    } else {
      const headshotPath = sameOriginPath(
        observed.pageUrl,
        observed.headshot.src,
      );
      if (headshotPath !== "/resume-site/headshot.jpg") {
        problems.push(`headshot ${observed.headshot.src}`);
      }
    }
  }

  if (feature === "mobile-layout") {
    if (!observed.signalMark) {
      problems.push("signal resume text missing");
    }
    if (observed.h1FontSize !== "36px") {
      problems.push(`h1 size ${observed.h1FontSize}`);
    }
    if (observed.gridTracks !== 1) {
      problems.push(`grid tracks ${observed.gridTracks}`);
    }
    if (observed.deckMoreDisplay !== "none") {
      problems.push(`deck continuation display ${observed.deckMoreDisplay}`);
    }
  }

  if (feature === "site-links") {
    if (!observed.stylesheetAbsolute?.endsWith("/resume-site/styles.css")) {
      problems.push(`stylesheet url ${observed.stylesheetAbsolute}`);
    }
    for (const link of links) {
      if (link.raw?.startsWith("/") || link.raw?.startsWith("//")) {
        problems.push(`root-absolute ${link.raw}`);
      }
      const resourcePath = sameOriginPath(observed.pageUrl, link.url);
      if (resourcePath && !resourcePath.startsWith("/resume-site/")) {
        problems.push(`outside project path ${link.url}`);
      }
      if (link.status < 200 || link.status >= 300) {
        problems.push(`${link.url} status ${link.status}`);
      }
    }
    requireResource(
      problems,
      links,
      (link) => link.url === "https://github.com/mmorsecode",
      "github profile",
    );
    requireResource(
      problems,
      links,
      (link) => link.url?.endsWith("/resume-site/styles.css"),
      "stylesheet",
    );
    requireResource(
      problems,
      links,
      (link) => link.url?.endsWith("/resume-site/headshot.jpg"),
      "headshot",
    );
    requireResource(
      problems,
      links,
      (link) => link.url?.endsWith("/resume-site/favicon.ico"),
      "favicon",
    );
    const pageInitiated = (snapshot.network ?? []).filter((item) => {
      if (!item.url || !observed.pageUrl) {
        return false;
      }
      const resourcePath = sameOriginPath(observed.pageUrl, item.url);
      if (!resourcePath || resourcePath.startsWith("/resume-site/")) {
        return false;
      }
      const fromPage =
        item.initiatorType === "parser" || item.initiatorType === "stylesheet";
      return (
        fromPage &&
        ["Document", "Stylesheet", "Image", "Font", "Script"].includes(
          item.type,
        )
      );
    });
    for (const item of pageInitiated) {
      problems.push(`browser loaded ${item.url}`);
    }
  }

  if (feature === "contact-privacy") {
    if (privacy?.status !== 0) {
      problems.push(`privacy scan status ${privacy?.status}`);
    }
    for (const finding of privacy?.findings ?? []) {
      problems.push(`visible ${finding}`);
    }
    if (privacy?.mailto) {
      problems.push("mailto link");
    }
    if (privacy?.tel) {
      problems.push("tel link");
    }
    if (
      observed.contact?.tag !== "SPAN" ||
      observed.contact?.text !== "Contact"
    ) {
      problems.push(`contact ${JSON.stringify(observed.contact)}`);
    }
  }

  return problems;
}

async function drive(feature) {
  if (!Object.hasOwn(viewports, feature)) {
    fail(
      `unknown feature ${feature}. expected ${Object.keys(viewports).join(", ")}`,
    );
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
  const resultPath = path.join(featureDir, "result.json");
  let captured;
  try {
    captured = await capturePage(
      instance.url,
      instance.chromePath || chromePath(),
      screenshot,
      viewports[feature],
    );
  } catch (error) {
    const snapshot = {
      feature,
      url: instance.url,
      viewport: viewports[feature],
      screenshot,
      problems: [error.message],
    };
    await writeFile(resultPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    fail(error.message);
    return;
  }

  let links = [];
  if (feature === "site-links") {
    links = await linkReport(captured);
  }
  let privacy = null;
  if (feature === "contact-privacy") {
    const scanned = spawnSync("npm", ["run", "privacy"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    const visible = captured.observed?.visibleText ?? "";
    const raw = (captured.observed?.referenced ?? [])
      .map((item) => item.raw ?? "")
      .join("\n");
    privacy = {
      status: scanned.status,
      findings: privacyFindings(visible),
      mailto: /mailto:/i.test(raw),
      tel: /\btel:/i.test(raw),
    };
  }

  const snapshot = {
    feature,
    url: instance.url,
    viewport: viewports[feature],
    screenshot,
    navigationStatus: captured.navigationStatus,
    stylesheetStatus: captured.stylesheetStatus,
    stylesheetUrl: captured.stylesheetUrl,
    observed: { ...captured.observed, visibleText: undefined },
    links,
    privacy,
    network: captured.network,
  };
  snapshot.problems = unmet(feature, captured, links, privacy);
  await writeFile(resultPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  if (snapshot.problems.length > 0) {
    fail(snapshot.problems.join("; "));
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
