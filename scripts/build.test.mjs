import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function assertDistMatchesSite() {
  const siteHtml = await readFile(path.join(root, "site/index.html"));
  const siteCss = await readFile(path.join(root, "site/styles.css"));
  const distHtml = await readFile(path.join(root, "dist/index.html"));
  const distCss = await readFile(path.join(root, "dist/styles.css"));
  assert.deepEqual(distHtml, siteHtml);
  assert.deepEqual(distCss, siteCss);
}

function runBuild() {
  return spawnSync(process.execPath, [path.join(root, "scripts/build.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
}

test("build copies site bytes and can run twice", async () => {
  const first = runBuild();
  assert.equal(first.status, 0, first.stderr);
  await assertDistMatchesSite();
  await assert.rejects(access(path.join(root, "dist.tmp")));
  await assert.rejects(access(path.join(root, "dist.previous")));

  const second = runBuild();
  assert.equal(second.status, 0, second.stderr);
  await assertDistMatchesSite();
  await assert.rejects(access(path.join(root, "dist.tmp")));
  await assert.rejects(access(path.join(root, "dist.previous")));
});
