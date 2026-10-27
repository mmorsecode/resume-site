import { cp, rename, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const siteDir = path.join(root, "site");
const distDir = path.join(root, "dist");
const tempDir = path.join(root, "dist.tmp");
const previousDir = path.join(root, "dist.previous");

await rm(tempDir, { recursive: true, force: true });
await rm(previousDir, { recursive: true, force: true });
await cp(siteDir, tempDir, { recursive: true });

try {
  await rename(distDir, previousDir);
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

try {
  await rename(tempDir, distDir);
} catch (error) {
  try {
    await rename(previousDir, distDir);
  } catch (restoreError) {
    if (restoreError.code !== "ENOENT") {
      throw restoreError;
    }
  }
  throw error;
}

await rm(previousDir, { recursive: true, force: true });
