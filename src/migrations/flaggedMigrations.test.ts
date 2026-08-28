import { beforeEach, describe, expect, it, vi } from "vitest";

import * as c from "../constants";

const mocks = vi.hoisted(() => ({
  assertGame: vi.fn(),
  combatAbilities: { get: vi.fn() },
  createCombat: vi.fn(),
  isActiveCharacterActor: vi.fn(),
  isNullOrEmptyString: vi.fn(),
  nanoid: vi.fn(),
  systemLogger: { info: vi.fn(), log: vi.fn() },
  useTurnPassingInitiative: { get: vi.fn() },
}));

vi.mock("nanoid", () => ({ nanoid: mocks.nanoid }));
vi.mock("../functions/isGame", () => ({ assertGame: mocks.assertGame }));
vi.mock("../functions/utilities", () => ({
  isNullOrEmptyString: mocks.isNullOrEmptyString,
  systemLogger: mocks.systemLogger,
}));
vi.mock("../module/actors/types", () => ({
  isActiveCharacterActor: mocks.isActiveCharacterActor,
}));
vi.mock("../module/combat/InvestigatorCombat", () => ({
  InvestigatorCombat: { create: mocks.createCombat },
}));
vi.mock("../presets", () => ({
  pathOfCthulhuPreset: { equipmentCategories: { general: {} } },
}));
vi.mock("../settings/settings", () => ({
  settings: {
    combatAbilities: mocks.combatAbilities,
    useTurnPassingInitiative: mocks.useTurnPassingInitiative,
  },
}));

import { flaggedMigrations } from "./flaggedMigrations";

describe("flagged migrations", () => {
  beforeEach(() => {
    mocks.assertGame.mockReset();
    mocks.combatAbilities.get.mockReset();
    mocks.combatAbilities.get.mockReturnValue(["Athletics"]);
    mocks.createCombat.mockReset();
    mocks.isActiveCharacterActor.mockReset();
    mocks.isActiveCharacterActor.mockReturnValue(true);
    mocks.isNullOrEmptyString.mockReset();
    mocks.isNullOrEmptyString.mockImplementation(
      (value: unknown) => value === null || value === undefined || value === "",
    );
    mocks.nanoid.mockReset();
    mocks.nanoid.mockReturnValue("generated-id");
    mocks.systemLogger.info.mockReset();
    mocks.systemLogger.log.mockReset();
    mocks.useTurnPassingInitiative.get.mockReset();
    mocks.useTurnPassingInitiative.get.mockReturnValue(false);
  });

  it("does not reapply completed item migrations", () => {
    const equipmentCategoryUpdate: Record<string, any> = {};
    flaggedMigrations.item["setEquipmentCategory"](
      { type: c.equipment, name: "Torch", system: { category: "" } },
      equipmentCategoryUpdate,
    );
    expect(equipmentCategoryUpdate["system"].category).toBe("general");
    expect(
      flaggedMigrations.item["setEquipmentCategory"](
        {
          type: c.equipment,
          name: "Torch",
          system: { category: equipmentCategoryUpdate["system"].category },
        },
        {},
      ),
    ).toEqual({});

    const categoryUpdate: Record<string, any> = {};
    flaggedMigrations.item["switchCategoryToCategoryId"](
      {
        type: c.equipment,
        name: "Torch",
        system: { category: "general", categoryId: "" },
      },
      categoryUpdate,
    );
    expect(categoryUpdate).toEqual({ system: { categoryId: "general" } });
    expect(
      flaggedMigrations.item["switchCategoryToCategoryId"](
        {
          type: c.equipment,
          name: "Torch",
          system: { category: "general", categoryId: "general" },
        },
        {},
      ),
    ).toEqual({});

    const unlockUpdate: Record<string, any> = {};
    flaggedMigrations.item["addIdtoUnlocks"](
      { type: c.equipment, system: { unlocks: [{ name: "Open" }] } },
      unlockUpdate,
    );
    expect(unlockUpdate["system"].unlocks).toEqual([
      { id: "Open", name: "Open" },
    ]);
    expect(
      flaggedMigrations.item["addIdtoUnlocks"](
        {
          type: c.equipment,
          system: { unlocks: unlockUpdate["system"].unlocks },
        },
        {},
      ),
    ).toEqual({});

    const cherryUpdate: Record<string, any> = {};
    flaggedMigrations.item["addIdToCherries"](
      { type: c.generalAbility, system: { unlocks: [{ name: "Cherry" }] } },
      cherryUpdate,
    );
    expect(cherryUpdate["system"].unlocks).toEqual([
      { id: "generated-id", name: "Cherry" },
    ]);
    expect(
      flaggedMigrations.item["addIdToCherries"](
        {
          type: c.generalAbility,
          system: { unlocks: cherryUpdate["system"].unlocks },
        },
        {},
      ),
    ).toEqual({});

    expect(
      flaggedMigrations.item["setResourceIdForAbilities"](
        {
          type: c.generalAbility,
          name: "Health",
          system: { linkToResource: true, resourceId: "health" },
        },
        {},
      ),
    ).toEqual({});
  });

  it("marks short-note conversion on an actor so a retry cannot duplicate items", () => {
    const actor = {
      flags: {},
      name: "Ada",
      system: { occupation: "Detective", shortNotes: ["A note"] },
      type: c.pc,
    };
    const updateData: Record<string, any> = {};

    flaggedMigrations.actor["turnShortNotesIntoPersonalDetails"](
      actor,
      updateData,
    );

    expect(updateData["items"]).toHaveLength(2);
    expect(
      updateData["flags"][c.systemId].migrations
        .turnShortNotesIntoPersonalDetails,
    ).toBe(true);
    expect(
      flaggedMigrations.actor["turnShortNotesIntoPersonalDetails"](
        { ...actor, flags: updateData["flags"] },
        {},
      ),
    ).toEqual({});
  });

  it("does not reset an actor initiative ability that is already migrated", () => {
    const updateData: Record<string, any> = {};
    flaggedMigrations.actor["setInitiativeAbilityWhereUndefined"](
      { system: { initiativeAbility: "" } },
      updateData,
    );
    expect(updateData).toEqual({ system: { initiativeAbility: "Athletics" } });
    expect(
      flaggedMigrations.actor["setInitiativeAbilityWhereUndefined"](
        { system: { initiativeAbility: "Athletics" } },
        {},
      ),
    ).toEqual({});
  });

  it("clears migrated world short notes so a retry preserves the new setting", async () => {
    let shortNotes = ["A note"];
    const set = vi.fn().mockImplementation((_namespace, key, value) => {
      if (key === "shortNotes") shortNotes = value;
      return Promise.resolve();
    });
    Object.assign(globalThis, {
      game: { settings: { get: vi.fn(() => shortNotes), set } },
    });

    await flaggedMigrations.world["convertShortNotesToPersonalDetails"](
      null,
      null,
    );
    expect(set).toHaveBeenCalledWith("investigator", "shortNotes", []);

    set.mockClear();
    await flaggedMigrations.world["convertShortNotesToPersonalDetails"](
      null,
      null,
    );
    expect(set).not.toHaveBeenCalled();
  });

  it("reuses an interrupted combat replacement instead of creating a duplicate", async () => {
    const combats: any[] = [];
    const oldCombat = {
      _id: "old-combat",
      active: true,
      delete: vi.fn(),
      id: "old-combat",
      toObject: () => ({ combatants: [], flags: {} }),
      type: "base",
    };
    const replacement = {
      activate: vi.fn().mockResolvedValue(undefined),
      active: false,
      flags: {} as any,
      id: "new-combat",
      setFlag: vi.fn().mockImplementation((scope, key, value) => {
        replacement.flags[scope] = {
          ...replacement.flags[scope],
          [key]: value,
        };
        return Promise.resolve();
      }),
      setupTurns: vi.fn(),
      type: "classic",
    };
    combats.push(oldCombat);
    Object.assign(globalThis, {
      game: { combats: { contents: combats } },
      ui: { notifications: { info: vi.fn() } },
    });
    mocks.createCombat.mockImplementation((data) => {
      replacement.flags = data.flags;
      combats.push(replacement);
      return Promise.resolve(replacement);
    });
    oldCombat.delete.mockRejectedValueOnce(new Error("delete failed"));

    await expect(
      flaggedMigrations.world["convertCombats"](null, null),
    ).rejects.toThrow("delete failed");

    oldCombat.delete.mockImplementation(() => {
      combats.splice(combats.indexOf(oldCombat), 1);
      return Promise.resolve();
    });
    await flaggedMigrations.world["convertCombats"](null, null);

    expect(mocks.createCombat).toHaveBeenCalledTimes(1);
    expect(oldCombat.delete).toHaveBeenCalledTimes(2);
    expect(replacement.activate).toHaveBeenCalledTimes(1);
    // the marker is consumed, so a later run can't re-activate a combat the
    // GM has since deactivated
    expect(replacement.flags[c.systemId].migratedFromActiveCombat).toBe(false);

    await flaggedMigrations.world["convertCombats"](null, null);
    expect(replacement.activate).toHaveBeenCalledTimes(1);
  });
});
