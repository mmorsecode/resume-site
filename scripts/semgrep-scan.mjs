import { spawnSync } from "node:child_process";

const args = ["--config", "p/default", "--error", "--metrics=off"];
const result = spawnSync("semgrep", args, { stdio: "inherit" });

if (result.error) {
  if (result.error.code === "ENOENT") {
    console.error(
      "Semgrep is not installed. Install it with: pipx install semgrep",
    );
    console.error(
      "That is the install step in .github/workflows/ci.yml. Then run npm run check again.",
    );
    process.exit(1);
  }
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
