import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function scan(dir) {
  return spawnSync(
    process.execPath,
    [path.join(root, "scripts/links-scan.mjs"), dir],
    { cwd: root, encoding: "utf8" },
  );
}

async function fixture(files) {
  const dir = await mkdtemp(path.join(tmpdir(), "links-"));
  for (const [name, contents] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, contents);
  }
  return dir;
}

test("root-absolute url is a finding when the file exists", async () => {
  const dir = await fixture({
    "index.html": '<link rel="stylesheet" href="/styles.css" />',
    "styles.css": "html { color: black; }",
  });
  try {
    const result = scan(dir);
    assert.equal(result.status, 1);
    assert.match(`${result.stdout}${result.stderr}`, /root-absolute/);
    assert.match(`${result.stdout}${result.stderr}`, /\/styles\.css/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("project-prefixed root-absolute url is a finding", async () => {
  const dir = await fixture({
    "index.html": '<a href="/resume-site/styles.css">Resume</a>',
    "resume-site/styles.css": "html { color: black; }",
  });
  try {
    const result = scan(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /root-absolute/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("relative url that exists is not a finding", async () => {
  const dir = await fixture({
    "index.html": '<link rel="stylesheet" href="styles.css" />',
    "styles.css": "html { color: black; }",
  });
  try {
    const result = scan(dir);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
