import { PersonalDetail } from "@lumphammer/investigator-fvtt-types";
import { nanoid } from "nanoid";

import * as c from "../constants";
import { assertGame } from "../functions/isGame";
import { isNullOrEmptyString, systemLogger } from "../functions/utilities";
import { isActiveCharacterActor } from "../module/actors/types";
import { InvestigatorCombat } from "../module/combat/InvestigatorCombat";
import { pathOfCthulhuPreset } from "../presets";
import { settings } from "../settings/settings";
import { FlaggedMigrations } from "./types";

export const flaggedMigrations: FlaggedMigrations = {
  item: {
    /**
     * If you launch a world that predates the concept of equipment categories,
     * your category list will be initialised to the default value, which is a
     * single category called "general". This migration will set the category
     * field on any existing equipment.
     */
    setEquipmentCategory: (item: any, updateData: any) => {
      if (
        item.type === c.equipment &&
        isNullOrEmptyString(item.system.category)
      ) {
        systemLogger.info(`Migrating item ${item.name} to set category`);
        if (!updateData.system) {
          updateData.system = {};
        }
        updateData.system.category = Object.keys(
          pathOfCthulhuPreset.equipmentCategories,
        )[0];
      }
      return updateData;
    },
    /**
     * We've added an id to the unlocks array, which makes it easier to do
     * in/out UI transitions. This migration will add an id to any existing
     * unlocks.
     */
    addIdtoUnlocks: (item: any, updateData: any) => {
      if (item.type === c.equipment) {
        const unlocks = item.system?.unlocks ?? [];
        if (unlocks.every((unlock: any) => unlock.id)) {
          return updateData;
        }
        const updatedUnlocks = unlocks.map((unlock: any) => {
          if (unlock.id) {
            return unlock;
          }
          return {
            ...unlock,
            id: unlock.name,
          };
        });
        updateData.system = {
          ...updateData.system,
          unlocks: updatedUnlocks,
        };
      }
    },
    switchCategoryToCategoryId: (item: any, updateData: any) => {
      if (
        item.type === c.generalAbility ||
        item.type === c.investigativeAbility ||
        item.type === c.equipment
      ) {
        if (
          isNullOrEmptyString(item.system.category) ||
          !isNullOrEmptyString(item.system.categoryId)
        ) {
          return updateData;
        }
        systemLogger.info(
          `Migrating item ${item.name}. category: ${item.system.category}, categoryId: ${item.system.categoryId}`,
        );
        if (!updateData.system) {
          updateData.system = {};
        }
        updateData.system.categoryId = item.system.category;
        delete updateData.system.category;
        systemLogger.info(
          `Done ${item.name}. updateData: ${JSON.stringify(updateData)}`,
        );
      }
      return updateData;
    },

    /*
     * Once up a time, cherries (unlocks) did not have ids. This made it hard to
     * manage them except by index.
     *
     * A while later, we added ids to the unlock model, but never did a
     * migration ,leaving older abilities with invalid but still weirdly
     * functional cherries.
     *
     * This migration finally fixes that.
     */
    addIdToCherries: (item: any, updateData: any) => {
      if (item.type !== c.generalAbility) {
        return updateData;
      }
      const needsFix =
        item.system?.unlocks?.some((unlock: any) => unlock.id === undefined) ??
        false;
      if (!needsFix) {
        return updateData;
      }
      if (!updateData.system) {
        updateData.system = {};
      }
      updateData.system.unlocks =
        item.system?.unlocks?.map((unlock: any) => {
          if (unlock.id === undefined) {
            return { ...unlock, id: nanoid() };
          }
          return unlock;
        }) ?? [];

      return updateData;
    },
    /**
     * Previously, resources with the names "health", "stability", "sanity",
     * or "magic" were given special handling and used to update the resource
     * value with the same name. This caused issues when folks had custom
     * abilities, such as "gesundheit" which they wanted to track as resources.
     *
     * The new system allow any ability to define a resource key which it will
     * sync with.
     */
    setResourceIdForAbilities: (item: any, updateData: any) => {
      const affectedAbilityNames = ["health", "stability", "sanity", "magic"];
      const normalisedName = item.name.trim().toLowerCase();
      const isAffected = affectedAbilityNames.includes(normalisedName);
      if (
        item.type === c.generalAbility &&
        isAffected &&
        (item.system.resourceId !== normalisedName ||
          item.system.linkToResource !== true)
      ) {
        if (!updateData.system) {
          updateData.system = {};
        }
        updateData.system.resourceId = normalisedName;
        updateData.system.linkToResource = true;
      }
      return updateData;
    },
  },
  actor: {
    /**
     * We used to use an array of strings as our "short notes". We have now
     * upgraded these to full items so they can given descriptions and images,
     * included in compendiums etc. This migration will turn any exsiting
     * text-based short notes into new personalDetail items.
     */
    turnShortNotesIntoPersonalDetails: (actor: any, updateData: any) => {
      if (
        actor.type === c.pc &&
        !actor.flags?.[c.systemId]?.migrations
          ?.turnShortNotesIntoPersonalDetails &&
        ((actor.system.shortNotes?.length ?? 0) > 0 ||
          !isNullOrEmptyString(actor.system.occupation))
      ) {
        systemLogger.info(
          `Migrating actor ${actor.name} to turn short notes into personal details`,
        );
        if (!updateData.system) {
          updateData.system = {};
        }
        const shortNoteItems = actor.system.shortNotes
          .map((shortNote: string, i: number) => ({
            type: c.personalDetail,
            img: c.personalDetailIcon,
            name: shortNote,
            system: {
              slotIndex: i,
            },
          }))
          .filter((item: any) => item.name !== null);
        const occupationItem = isNullOrEmptyString(actor.system.occupation)
          ? []
          : [
              {
                type: c.personalDetail,
                img: c.personalDetailIcon,
                name: actor.system.occupation,
                system: {
                  slotIndex: c.occupationSlotIndex,
                },
              },
            ];
        updateData.items = (updateData.items ?? [])
          .concat(shortNoteItems)
          .concat(occupationItem);
        updateData.flags = {
          [c.systemId]: {
            ...actor.flags?.[c.systemId],
            migrations: {
              ...actor.flags?.[c.systemId]?.migrations,
              turnShortNotesIntoPersonalDetails: true,
            },
          },
        };
      }
      return updateData;
    },
    /**
     * For a long time, actors were created without a valid intiative ability.
     * This migration will set the initiative ability to the first one in the
     * list if it's not already set.
     */
    setInitiativeAbilityWhereUndefined: (actor: any, updateData: any) => {
      const initiativeAbility = settings.combatAbilities.get()[0];
      if (
        !isActiveCharacterActor(actor) ||
        isNullOrEmptyString(initiativeAbility) ||
        !isNullOrEmptyString(actor.system.initiativeAbility)
      ) {
        return updateData;
      }
      if (!updateData.system) {
        updateData.system = {};
      }
      updateData.system.initiativeAbility = initiativeAbility;
    },
  },
  world: {
    /**
     * Personal details are like short notes 2.0. This migration will take the
     * old short notes and turn them into personal details.
     */
    convertShortNotesToPersonalDetails: async () => {
      assertGame(game);
      const shortNotes = game.settings.get("investigator", "shortNotes");
      if (shortNotes.length === 0) return;
      const personalDetails: PersonalDetail[] = shortNotes.map((name) => ({
        name,
        type: "item",
      }));
      await game.settings.set(
        "investigator",
        "personalDetails",
        personalDetails,
      );
      await game.settings.set("investigator", "shortNotes", []);
    },
    convertCombats: async () => {
      assertGame(game);
      ui.notifications?.info("Migrating combats");
      const oldBaseCombats = game.combats.contents.filter(
        (c) => c.type === "base",
      );
      const newType = settings.useTurnPassingInitiative.get()
        ? "turnPassing"
        : "classic";
      let newActiveCombat: Combat.Stored | null = null;
      for (const oldBaseCombat of oldBaseCombats) {
        systemLogger.log(`migrating combat ${oldBaseCombat._id}`);
        const oldCombatId = oldBaseCombat.id ?? oldBaseCombat._id;
        if (!oldCombatId) {
          throw new Error("Cannot migrate a combat without an id");
        }
        let newCombat = game.combats.contents.find(
          (combat) =>
            combat.flags?.[c.systemId]?.migratedFromCombatId === oldCombatId,
        );
        if (!newCombat) {
          const baseData = oldBaseCombat.toObject();
          newCombat = await InvestigatorCombat.create({
            ...baseData,
            combatants: baseData.combatants.map((c) => {
              const system = c.system;
              if (newType === "classic") {
                system.initiative = c.initiative;
              }
              return { ...c, type: newType, system };
            }),
            flags: {
              ...baseData.flags,
              [c.systemId]: {
                ...baseData.flags?.[c.systemId],
                migratedFromCombatId: oldCombatId,
                migratedFromActiveCombat: oldBaseCombat.active,
              },
            },
            type: newType,
          });
          if (newCombat !== undefined) {
            newCombat.setupTurns();
          }
        }
        if (newCombat === undefined) {
          throw new Error(
            `Failed to create replacement for combat ${oldCombatId}`,
          );
        }
        if (oldBaseCombat.active) {
          newActiveCombat = newCombat;
        }
        await oldBaseCombat.delete();
      }
      // If an earlier run was interrupted after deleting the old combat but
      // before activating its replacement, finish that job now.
      if (newActiveCombat === null) {
        newActiveCombat =
          game.combats.contents.find(
            (combat) =>
              combat.flags?.[c.systemId]?.migratedFromActiveCombat &&
              !combat.active,
          ) ?? null;
      }
      if (newActiveCombat) {
        await newActiveCombat.activate();
        // clear the marker so we can't keep re-activating a combat that the
        // GM has since deliberately deactivated.
        await newActiveCombat.setFlag(
          c.systemId,
          "migratedFromActiveCombat",
          false,
        );
      }
    },
  },
  compendium: {},
  journal: {},
  macro: {},
  scene: {},
  rollTable: {},
  playlist: {},
};
