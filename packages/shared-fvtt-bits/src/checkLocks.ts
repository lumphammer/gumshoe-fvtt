import { exec } from "child_process";
import { existsSync } from "fs";

/**
 * Shell out to `find` to check for any open LOCK files in the given directory.
 */
export const checkLocks = (dir: string) => {
  return new Promise<string>((resolve, reject) => {
    // if destDir is not a directory, throw an error
    if (!existsSync(dir)) {
      resolve("");
    }
    const data: string[] = [];
    const proc = exec(
      `find ${dir} -name LOCK -exec sh -c 'for f; do db=$(dirname "$f"); pids=$(fuser "$f" 2>/dev/null | xargs -n1 | sed "s/[^0-9].*//"); [ -n "$pids" ] && for pid in $pids; do echo "$db $pid"; done; done' _ {} +`,
    );
    proc.stdout?.on("data", (chunk) => {
      data.push(chunk.toString().trim());
    });
    proc.stderr?.on("data", (chunk) => {
      reject(new Error(chunk.toString().trim()));
    });
    proc.on("close", (code) => {
      if (code === 0 || code === 1) {
        resolve(data.join("\n"));
      } else {
        reject(
          new Error(
            `fuser check errored out for ${dir}: ${data.join("\n")} (code: ${code})`,
          ),
        );
      }
    });
  });
};
