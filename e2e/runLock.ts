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

/** Whether the file was made in the last few seconds. */
function isRecent(filePath: string): boolean {
  try {
    return Date.now() - fs.statSync(filePath).mtimeMs < 5000;
  } catch {
    return false;
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
  const lock = JSON.stringify({
    pid: process.pid,
    started: new Date().toISOString(),
  });
  for (let attempt = 0; ; attempt++) {
    try {
      // create it exclusively, so two runs starting together can't both get it
      fs.writeFileSync(lockPath, lock, { flag: "wx" });
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const holder = readLock(lockPath);
    // already ours (Playwright can load its config more than once)
    if (holder?.pid === process.pid) return;
    if (holder ? isRunning(holder.pid) : isRecent(lockPath)) {
      throw new Error(
        holder
          ? `Another test run (process ${holder.pid}, started ` +
              `${holder.started}) is using the Foundry at ${foundryUrl}. ` +
              "Wait for it to finish, or stop it, then try again."
          : `Another test run is starting on the Foundry at ${foundryUrl}.`,
      );
    }
    // left by a run that died: clear it and try again. If another run clears
    // it and gets in first, the next attempt finds theirs.
    if (attempt >= 2) {
      throw new Error(`Couldn't take the test run lock at ${lockPath}`);
    }
    fs.rmSync(lockPath, { force: true });
  }
  process.on("exit", () => {
    if (readLock(lockPath)?.pid === process.pid) fs.rmSync(lockPath);
  });
}
