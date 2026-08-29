import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  flaggedMigrations: {
    actor: { exampleActorMigration: vi.fn() },
    compendium: {},
    item: {},
    journal: {},
    macro: {},
    playlist: {},
    rollTable: {},
    scene: {},
    world: {},
  },
  migrateWorld: vi.fn(),
  settings: {
    firstRun: { get: vi.fn(), set: vi.fn() },
    migrationAttempts: { get: vi.fn(), set: vi.fn() },
    migrationFlags: { get: vi.fn(), set: vi.fn() },
    migrationLastError: { get: vi.fn(), set: vi.fn() },
    systemMigrationVersion: { get: vi.fn(), set: vi.fn() },
  },
}));

vi.mock("../migrations/flaggedMigrations", () => ({
  flaggedMigrations: mocks.flaggedMigrations,
}));
vi.mock("../migrations/migrateWorld", () => ({
  migrateWorld: mocks.migrateWorld,
}));
vi.mock("../settings/settings", () => ({ settings: mocks.settings }));

import {
  maximumAutomaticMigrationAttempts,
  migrateWorldIfNeeded,
  retryFailedMigrations,
} from "./migrateWorldIfNeeded";

describe("migrateWorldIfNeeded", () => {
  beforeEach(() => {
    class TestGame {}
    Object.assign(globalThis, {
      foundry: { Game: TestGame },
      game: Object.assign(new TestGame(), {
        user: { isGM: true },
        actors: { size: 1 },
        items: { size: 0 },
        scenes: { size: 0 },
      }),
    });
    vi.clearAllMocks();
    mocks.settings.firstRun.get.mockReturnValue(false);
    mocks.settings.migrationAttempts.get.mockReturnValue(0);
    mocks.settings.migrationLastError.get.mockReturnValue("");
    // nothing has run yet, so the actor migration is outstanding
    mocks.settings.migrationFlags.get.mockReturnValue({
      actor: {},
      compendium: {},
      item: {},
      journal: {},
      macro: {},
      playlist: {},
      rollTable: {},
      scene: {},
      world: {},
    });
    for (const setting of Object.values(mocks.settings)) {
      setting.set.mockResolvedValue(undefined);
    }
  });

  it("flags the migrations and clears the failure state on success", async () => {
    mocks.migrateWorld.mockResolvedValue(undefined);

    await migrateWorldIfNeeded();

    expect(mocks.migrateWorld).toHaveBeenCalledTimes(1);
    expect(mocks.settings.migrationFlags.set).toHaveBeenCalledWith(
      expect.objectContaining({ actor: { exampleActorMigration: true } }),
    );
    expect(mocks.settings.migrationAttempts.set).toHaveBeenCalledWith(0);
    expect(mocks.settings.migrationLastError.set).toHaveBeenCalledWith("");
  });

  it("counts a failure and leaves the migrations unflagged", async () => {
    mocks.migrateWorld.mockRejectedValue(new Error("fixture failure"));

    await expect(migrateWorldIfNeeded()).resolves.toBeUndefined();

    expect(mocks.settings.migrationFlags.set).not.toHaveBeenCalled();
    expect(mocks.settings.migrationAttempts.set).toHaveBeenCalledWith(1);
    expect(mocks.settings.migrationLastError.set).toHaveBeenCalledWith(
      "fixture failure",
    );
  });

  it("stops retrying automatically once the attempt limit is reached", async () => {
    mocks.settings.migrationAttempts.get.mockReturnValue(
      maximumAutomaticMigrationAttempts,
    );

    await migrateWorldIfNeeded();

    expect(mocks.migrateWorld).not.toHaveBeenCalled();
    expect(mocks.settings.migrationAttempts.set).not.toHaveBeenCalled();
  });

  it("runs anyway when the GM asks for a retry", async () => {
    mocks.settings.migrationAttempts.get.mockReturnValue(
      maximumAutomaticMigrationAttempts,
    );
    mocks.migrateWorld.mockResolvedValue(undefined);

    await retryFailedMigrations();

    expect(mocks.migrateWorld).toHaveBeenCalledTimes(1);
    expect(mocks.settings.migrationAttempts.set).toHaveBeenCalledWith(0);
  });

  it("does nothing when there are no outstanding migrations", async () => {
    mocks.settings.migrationFlags.get.mockReturnValue({
      actor: { exampleActorMigration: true },
      compendium: {},
      item: {},
      journal: {},
      macro: {},
      playlist: {},
      rollTable: {},
      scene: {},
      world: {},
    });

    await migrateWorldIfNeeded();

    expect(mocks.migrateWorld).not.toHaveBeenCalled();
  });

  it("does nothing for a non-GM user", async () => {
    (globalThis as any).game.user.isGM = false;

    await migrateWorldIfNeeded();

    expect(mocks.migrateWorld).not.toHaveBeenCalled();
  });
});
