import { describe, expect, it } from "vitest";

import { createKeyedQueue } from "./createKeyedQueue";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createKeyedQueue", () => {
  it("runs jobs with the same key one at a time, in order", async () => {
    const runExclusive = createKeyedQueue();
    const log: string[] = [];
    const job = (name: string) => async () => {
      log.push(`${name} start`);
      await tick();
      log.push(`${name} end`);
    };
    await Promise.all([
      runExclusive("a", job("first")),
      runExclusive("a", job("second")),
    ]);
    expect(log).toEqual([
      "first start",
      "first end",
      "second start",
      "second end",
    ]);
  });

  it("lets a later job see what an earlier one did", async () => {
    // the double-apply race: both jobs check, then act
    const runExclusive = createKeyedQueue();
    let applied = false;
    let health = 10;
    const apply = async () => {
      if (applied) return;
      await tick();
      health -= 4;
      applied = true;
    };
    await Promise.all([runExclusive("a", apply), runExclusive("a", apply)]);
    expect(health).toBe(6);
  });

  it("runs jobs with different keys independently", async () => {
    const runExclusive = createKeyedQueue();
    const log: string[] = [];
    const job = (name: string) => async () => {
      log.push(`${name} start`);
      await tick();
      log.push(`${name} end`);
    };
    await Promise.all([
      runExclusive("a", job("a")),
      runExclusive("b", job("b")),
    ]);
    expect(log.slice(0, 2)).toEqual(["a start", "b start"]);
  });

  it("carries on after a job throws", async () => {
    const runExclusive = createKeyedQueue();
    const failing = runExclusive("a", () => Promise.reject(new Error("nope")));
    const next = runExclusive("a", () => Promise.resolve("ok"));
    await expect(failing).rejects.toThrow("nope");
    await expect(next).resolves.toBe("ok");
  });

  it("returns the job's result", async () => {
    const runExclusive = createKeyedQueue();
    await expect(runExclusive("a", () => Promise.resolve(42))).resolves.toBe(
      42,
    );
  });
});
