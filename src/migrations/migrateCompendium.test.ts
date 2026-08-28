import { beforeEach, describe, expect, it, vi } from "vitest";

import { migrateCompendium } from "./migrateCompendium";
import { FlaggedMigrations } from "./types";

const mocks = vi.hoisted(() => ({
  migrateActorData: vi.fn(),
  migrateItemData: vi.fn(),
  migrateSceneData: vi.fn(),
}));

vi.mock("./migrateActorData", () => ({
  migrateActorData: mocks.migrateActorData,
}));
vi.mock("./migrateItemData", () => ({
  migrateItemData: mocks.migrateItemData,
}));
vi.mock("./migrateSceneData", () => ({
  migrateSceneData: mocks.migrateSceneData,
}));

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

const makeItemPack = (overrides: Record<string, any> = {}) => ({
  collection: "investigator.items",
  locked: true,
  metadata: { type: "Item" },
  configure: vi.fn().mockResolvedValue(undefined),
  migrate: vi.fn().mockResolvedValue(undefined),
  getDocuments: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe("migrateCompendium", () => {
  beforeEach(() => {
    Object.assign(globalThis, {
      foundry: {
        utils: { isEmpty: (value: object) => Object.keys(value).length === 0 },
      },
    });
    mocks.migrateActorData.mockReset();
    mocks.migrateItemData.mockReset();
    mocks.migrateItemData.mockReturnValue({ system: { changed: true } });
    mocks.migrateSceneData.mockReset();
  });

  it("restores the pack lock and rejects when an entry migration fails", async () => {
    const migrations: FlaggedMigrations = {
      ...emptyMigrations,
      item: { exampleItemMigration: vi.fn() },
    };
    const pack = makeItemPack({
      getDocuments: vi.fn().mockResolvedValue([
        {
          id: "item-id",
          name: "Broken item",
          update: vi.fn().mockRejectedValue(new Error("fixture failure")),
          uuid: "Compendium.investigator.items.Item.item-id",
        },
      ]),
    });

    await expect(migrateCompendium(pack, migrations)).rejects.toThrow(
      "Item Broken item (Compendium.investigator.items.Item.item-id) in pack investigator.items: fixture failure",
    );

    expect(pack.configure).toHaveBeenNthCalledWith(1, { locked: false });
    expect(pack.configure).toHaveBeenLastCalledWith({ locked: true });
  });

  it("restores the pack lock when the pack itself fails to migrate", async () => {
    const migrations: FlaggedMigrations = {
      ...emptyMigrations,
      item: { exampleItemMigration: vi.fn() },
    };
    const pack = makeItemPack({
      migrate: vi.fn().mockRejectedValue(new Error("pack bang")),
    });

    await expect(migrateCompendium(pack, migrations)).rejects.toThrow(
      "pack investigator.items: pack bang",
    );

    expect(pack.configure).toHaveBeenLastCalledWith({ locked: true });
  });

  it("updates entries and leaves the lock as it found it on success", async () => {
    const migrations: FlaggedMigrations = {
      ...emptyMigrations,
      item: { exampleItemMigration: vi.fn() },
    };
    const update = vi.fn().mockResolvedValue(undefined);
    const pack = makeItemPack({
      locked: false,
      getDocuments: vi.fn().mockResolvedValue([
        {
          id: "item-id",
          name: "Migrated item",
          update,
          uuid: "Compendium.investigator.items.Item.item-id",
        },
      ]),
    });

    await migrateCompendium(pack, migrations);

    expect(update).toHaveBeenCalledWith({
      _id: "item-id",
      system: { changed: true },
    });
    expect(pack.configure).toHaveBeenLastCalledWith({ locked: false });
  });
});
