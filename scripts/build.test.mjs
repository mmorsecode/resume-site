import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runBuild() {
  return spawnSync("npm", ["run", "build"], {
    cwd: root,
    encoding: "utf8",
  });
}

test("production build emits the resume with relative assets", async () => {
  const built = runBuild();
  assert.equal(built.status, 0, `${built.stdout}\n${built.stderr}`);

  const html = await readFile(path.join(root, "dist/index.html"), "utf8");
  assert.match(html, /Michael Morse/);
  assert.match(html, /Framingham, MA/);
  assert.match(html, /https:\/\/github\.com\/mmorsecode/);
  assert.match(html, /headshot\.jpg/);
  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /href\s*=\s*["']\//);
  assert.doesNotMatch(html, /src\s*=\s*["']\//);
  assert.equal(html.includes("Aerospace Ground Equipment"), false);
  await access(path.join(root, "dist/headshot.jpg"));
  await access(path.join(root, "dist/styles.css"));

  const config = await readFile(path.join(root, "vite.config.ts"), "utf8");
  assert.match(config, /base:\s*"\/resume-site\/"/);

  const again = runBuild();
  assert.equal(again.status, 0, `${again.stdout}\n${again.stderr}`);
});
