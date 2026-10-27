import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function scan(filePath) {
  const args = [path.join(root, "scripts/privacy-scan.mjs")];
  if (filePath !== undefined) {
    args.push(filePath);
  }
  return spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
}

async function withFixture(contents) {
  const dir = await mkdtemp(path.join(tmpdir(), "privacy-"));
  const filePath = path.join(dir, "fixture.txt");
  await writeFile(filePath, contents);
  try {
    return scan(filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("dashed phone number is a finding and is not printed", async () => {
  const secret = ["555", "010", "0199"].join("-");
  const result = await withFixture(secret);
  assert.equal(result.status, 1);
  assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
});

test("parenthesized phone number is a finding and is not printed", async () => {
  const secret = ["(", "555", ") ", "010", "-", "0199"].join("");
  const result = await withFixture(secret);
  assert.equal(result.status, 1);
  assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
});

test("international phone number is a finding and is not printed", async () => {
  const secret = ["+44", "20", "7946", "0958"].join(" ");
  const result = await withFixture(secret);
  assert.equal(result.status, 1);
  assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
});

test("street address is a finding and is not printed", async () => {
  const secret = ["123", "Fake", "Street"].join(" ");
  const result = await withFixture(secret);
  assert.equal(result.status, 1);
  assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
});

test("ordinary strings are not findings", async () => {
  const samples = [
    "Node 22",
    "2026-10-27",
    "actions/checkout@v6",
    "1.0.0",
    "#112233",
    "This page is a placeholder. The resume is not published yet.",
  ];
  for (const sample of samples) {
    const result = await withFixture(sample);
    assert.equal(result.status, 0, sample);
  }
});

test("tracked repo files have no findings", () => {
  const result = scan();
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});
