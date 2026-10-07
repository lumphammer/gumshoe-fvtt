import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function isRunning(pid: number): boolean {
  try {
    // signal 0 checks the process exists without touching it
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: it exists, but isn't ours
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

type Lock = { pid: number; started: string };

/** Who holds the lock, if anyone (a half-written lock counts as no one). */
function readLock(lockPath: string): Lock | null {
  try {
    return JSON.parse(fs.readFileSync(lockPath, "utf8")) as Lock;
  } catch {
    return null;
  }
}

/**
 * Stop two test runs using the same Foundry at once. They'd trample each
 * other: both log in as the Gamemaster (Foundry logs out the first), each
 * resets the world and clears `test-results/` when it starts, and they create
 * the same users.
 *
 * Call this when the runner starts (before Playwright clears its output). It
 * throws if another run that's still going holds the lock, and releases it
 * when this process exits. A lock left by a run that died is taken over.
 */
export function takeRunLock(foundryUrl: string, foundryDataPath: string) {
  // in the Foundry's data folder if it's here, so every checkout and shell on
  // this machine sees it
  const lockPath = fs.existsSync(foundryDataPath)
    ? path.join(foundryDataPath, "e2e-run.lock")
    : path.join(
        os.tmpdir(),
        `investigator-e2e-${encodeURIComponent(foundryUrl)}.lock`,
      );
  const holder = readLock(lockPath);
  if (holder && holder.pid !== process.pid && isRunning(holder.pid)) {
    throw new Error(
      `Another test run (process ${holder.pid}, started ${holder.started}) ` +
        `is using the Foundry at ${foundryUrl}. Wait for it to finish, or ` +
        "stop it, then try again.",
    );
  }
  fs.writeFileSync(
    lockPath,
    JSON.stringify({ pid: process.pid, started: new Date().toISOString() }),
  );
  process.on("exit", () => {
    if (readLock(lockPath)?.pid === process.pid) fs.rmSync(lockPath);
  });
}
