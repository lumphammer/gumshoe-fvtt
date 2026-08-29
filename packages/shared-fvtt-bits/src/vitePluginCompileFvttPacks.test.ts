import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkLocks: vi.fn(),
  compilePack: vi.fn(),
}));

vi.mock("@foundryvtt/foundryvtt-cli", () => ({
  compilePack: mocks.compilePack,
}));

vi.mock("./checkLocks", () => ({
  checkLocks: mocks.checkLocks,
}));

import { vitePluginCompileFvttPacks } from "./vitePluginCompileFvttPacks";

describe("vitePluginCompileFvttPacks", () => {
  let temporaryRoot: string;
  let srcDir: string;
  let destDir: string;
  let manifestPath: string;

  beforeEach(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "investigator-packs-"));
    srcDir = resolve(temporaryRoot, "src");
    destDir = resolve(temporaryRoot, "build", "packs");
    manifestPath = resolve(temporaryRoot, "build", "system.json");
    await mkdir(resolve(srcDir, "example"), { recursive: true });
    await mkdir(resolve(destDir, "example"), { recursive: true });
    await writeFile(resolve(destDir, "example", "old.txt"), "old");
    await writeFile(
      manifestPath,
      JSON.stringify({ packs: [{ name: "Example", path: "packs/example" }] }),
    );
    mocks.checkLocks.mockReset();
    mocks.checkLocks.mockResolvedValue("");
    mocks.compilePack.mockReset();
    mocks.compilePack.mockImplementation(async (_source, destination) => {
      await mkdir(destination, { recursive: true });
      await writeFile(resolve(destination, "new.txt"), "new");
    });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  const runPlugin = async (mode: string) => {
    const plugin = vitePluginCompileFvttPacks({ srcDir, destDir }) as any;
    await plugin.configResolved({ mode });
    await plugin.closeBundle();
  };

  it("fails a production build when a pack database is locked", async () => {
    mocks.checkLocks.mockResolvedValue(`${destDir}/example 1234`);

    await expect(runPlugin("production")).rejects.toThrow(
      "The following FVTT pack databases are open in another process",
    );

    expect(mocks.compilePack).not.toHaveBeenCalled();
    expect(await readFile(resolve(destDir, "example", "old.txt"), "utf8")).toBe(
      "old",
    );
  });

  it("keeps locked development builds best-effort but still validates the manifest", async () => {
    mocks.checkLocks.mockResolvedValue(`${destDir}/example 1234`);

    await expect(runPlugin("dev")).resolves.toBeUndefined();
    await rm(resolve(destDir, "example"), { recursive: true });
    await expect(runPlugin("dev")).rejects.toThrow(
      "do not resolve to LevelDB directories",
    );

    expect(mocks.compilePack).not.toHaveBeenCalled();
  });

  it("leaves the existing packs untouched when compilation fails", async () => {
    mocks.compilePack.mockRejectedValue(new Error("compile failed"));

    await expect(runPlugin("production")).rejects.toThrow("compile failed");

    expect(await readFile(resolve(destDir, "example", "old.txt"), "utf8")).toBe(
      "old",
    );
    expect((await readdir(resolve(temporaryRoot, "build"))).sort()).toEqual([
      "packs",
      "system.json",
    ]);
  });

  it("leaves the existing packs untouched when staging validation fails", async () => {
    await writeFile(
      manifestPath,
      JSON.stringify({
        packs: [
          { name: "Example", path: "packs/example" },
          { name: "Missing", path: "packs/missing" },
        ],
      }),
    );

    await expect(runPlugin("production")).rejects.toThrow(
      "do not resolve to LevelDB directories",
    );

    expect(await readFile(resolve(destDir, "example", "old.txt"), "utf8")).toBe(
      "old",
    );
  });

  it("replaces the destination only after successful staging validation", async () => {
    await runPlugin("production");

    await expect(
      readFile(resolve(destDir, "example", "old.txt"), "utf8"),
    ).rejects.toThrow();
    expect(await readFile(resolve(destDir, "example", "new.txt"), "utf8")).toBe(
      "new",
    );
    expect((await readdir(resolve(temporaryRoot, "build"))).sort()).toEqual([
      "packs",
      "system.json",
    ]);
  });
});
