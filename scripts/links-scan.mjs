import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const distDir = path.resolve(repoRoot, process.argv[2] ?? "dist");

const urlPattern = /(?:(?:href|src|poster)\s*=\s*|url\(\s*)["']?([^"'\s)>]+)/gi;

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

export function rootAbsoluteUrls(text) {
  const found = [];
  urlPattern.lastIndex = 0;
  let match = urlPattern.exec(text);
  while (match !== null) {
    const url = match[1];
    if (url.startsWith("/") || url.startsWith("//")) {
      found.push({ url, line: lineOf(text, match.index) });
    }
    if (match[0].length === 0) {
      urlPattern.lastIndex += 1;
    }
    match = urlPattern.exec(text);
  }
  return found;
}

async function listFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name))
    .filter((filePath) => /\.(html|css|js|svg)$/i.test(filePath));
}

let findings = 0;
const files = await listFiles(distDir);
for (const filePath of files) {
  const text = await readFile(filePath, "utf8");
  for (const finding of rootAbsoluteUrls(text)) {
    const relative = path.relative(repoRoot, filePath);
    process.stdout.write(
      `root-absolute ${relative}:${finding.line} ${finding.url}\n`,
    );
    findings += 1;
  }
}

const linked = spawnSync(
  "npx",
  ["linkinator", distDir, "--recurse", "--verbosity", "error"],
  { cwd: repoRoot, encoding: "utf8" },
);
if (linked.stdout) {
  process.stdout.write(linked.stdout);
}
if (linked.stderr) {
  process.stderr.write(linked.stderr);
}

if (findings > 0 || linked.status !== 0) {
  process.exitCode = 1;
}
