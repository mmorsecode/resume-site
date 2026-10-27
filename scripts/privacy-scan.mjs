import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { rules } from "./privacy-rules.mjs";

function listPaths() {
  const args = process.argv.slice(2).filter((entry) => entry.length > 0);
  if (args.length > 0) {
    return args;
  }

  const listed = spawnSync("git", ["ls-files", "-z"]);
  if (listed.error || listed.status !== 0) {
    process.exit(
      listed.status === 0 || listed.status === null ? 1 : listed.status,
    );
  }

  return Buffer.from(listed.stdout ?? [])
    .toString("utf8")
    .split("\0")
    .filter((entry) => entry.length > 0);
}

let findings = 0;

for (const filePath of listPaths()) {
  const data = await readFile(filePath);
  if (data.includes(0)) {
    continue;
  }

  const text = data.toString("utf8");
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    let match = rule.pattern.exec(text);
    while (match !== null) {
      const line = text.slice(0, match.index).split("\n").length;
      process.stdout.write(`${rule.id} ${filePath}:${line}\n`);
      findings += 1;
      if (match[0].length === 0) {
        rule.pattern.lastIndex += 1;
      }
      match = rule.pattern.exec(text);
    }
  }
}

if (findings > 0) {
  process.exitCode = 1;
}
