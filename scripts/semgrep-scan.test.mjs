import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("missing semgrep exits with the install step", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/semgrep-scan.mjs")],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, PATH: "/usr/bin:/bin" },
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /pipx install semgrep/);
  assert.match(result.stderr, /\.github\/workflows\/ci\.yml/);
});
