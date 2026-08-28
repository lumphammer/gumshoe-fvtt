import { beforeEach, describe, expect, it, vi } from "vitest";

import { FlaggedMigrations } from "./types";

const mocks = vi.hoisted(() => ({
  flaggedMigrations: {
    actor: {},
    compendium: {},
    item: {},
    journal: {},
    macro: {},
    playlist: {},
    rollTable: {},
    scene: {},
    world: {},
  },
  migrateActorData: vi.fn(),
  migrateCompendium: vi.fn(),
  migrateItemData: vi.fn(),
  migrateSceneData: vi.fn(),
}));

vi.mock("./flaggedMigrations", () => ({
  flaggedMigrations: mocks.flaggedMigrations,
}));
vi.mock("./migrateActorData", () => ({
  migrateActorData: mocks.migrateActorData,
}));
vi.mock("./migrateCompendium", () => ({
  migrateCompendium: mocks.migrateCompendium,
}));
vi.mock("./migrateItemData", () => ({
  migrateItemData: mocks.migrateItemData,
}));
vi.mock("./migrateSceneData", () => ({
  migrateSceneData: mocks.migrateSceneData,
}));

import { migrateWorld } from "./migrateWorld";

const emptyMigrations: FlaggedMigrations = {
  actor: {},
  compendium: {},
  item: {},
  journal: {},
  macro: {},
  playlist: {},
  rollTable: {},
  scene: {},
  world: {},
};

describe("migrateWorld", () => {
  const setSetting = vi.fn();
  const notify = vi.fn();
  const notifyError = vi.fn();

  beforeEach(() => {
    class TestGame {}

    Object.assign(globalThis, {
      foundry: {
        Game: TestGame,
        utils: { isEmpty: (value: object) => Object.keys(value).length === 0 },
      },
      game: Object.assign(new TestGame(), {
        system: { version: "test-version" },
        actors: {
          contents: [
            {
              id: "actor-id",
              name: "Broken actor",
              update: vi.fn(),
              uuid: "Actor.actor-id",
            },
          ],
        },
        items: { contents: [] },
        scenes: { contents: [] },
        packs: [],
        settings: { set: setSetting },
      }),
      ui: { notifications: { error: notifyError, info: notify } },
    });
    setSetting.mockReset();
    setSetting.mockResolvedValue(undefined);
    notify.mockReset();
    notifyError.mockReset();
    mocks.migrateActorData.mockReset();
    mocks.migrateCompendium.mockReset();
    mocks.migrateItemData.mockReset();
    mocks.migrateSceneData.mockReset();
  });

  it("does not mark the migration complete when an entity migration fails", async () => {
    const migrations: FlaggedMigrations = {
      ...emptyMigrations,
      actor: { exampleActorMigration: vi.fn() },
    };
    mocks.migrateActorData.mockImplementation(() => {
      throw new Error("fixture failure");
    });

    await expect(migrateWorld(migrations)).rejects.toThrow(
      "Actor Broken actor (Actor.actor-id): fixture failure",
    );

    expect(notifyError).toHaveBeenCalledWith(
      expect.stringContaining("fixture failure"),
      expect.anything(),
    );
    expect(
      setSetting.mock.calls.some(([, key]) => key === "systemMigrationVersion"),
    ).toBe(false);
    expect(notify).not.toHaveBeenCalledWith(
      expect.stringContaining("completed"),
      expect.anything(),
    );
  });

  it("reports every failing target in a single error", async () => {
    const migrations: FlaggedMigrations = {
      ...emptyMigrations,
      world: {
        brokenWorldMigration: vi
          .fn()
          .mockRejectedValue(new Error("world bang")),
      },
      actor: { exampleActorMigration: vi.fn() },
    };
    mocks.migrateActorData.mockImplementation(() => {
      throw new Error("actor bang");
    });

    await expect(migrateWorld(migrations)).rejects.toThrow(
      /failed for 2 targets.*world bang.*actor bang/s,
    );
  });

  it("records the migration as complete when everything succeeds", async () => {
    const migrations: FlaggedMigrations = {
      ...emptyMigrations,
      actor: { exampleActorMigration: vi.fn() },
    };
    mocks.migrateActorData.mockReturnValue({});

    await migrateWorld(migrations);

    expect(mocks.migrateActorData).toHaveBeenCalledTimes(1);
    expect(
      setSetting.mock.calls.some(([, key]) => key === "systemMigrationVersion"),
    ).toBe(true);
    expect(notify).toHaveBeenCalledWith(
      expect.stringContaining("completed"),
      expect.anything(),
    );
  });
});
