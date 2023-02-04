import * as c from "../constants";
import { isNullOrEmptyString } from "../functions";
import { pathOfCthulhuPreset } from "../presets";
import { FlaggedMigrations } from "./types";

export const flaggedMigrations: FlaggedMigrations = {
  item: {
    /**
     * If you launch a world that predates the concept of equipment categories,
     * your category list will be initialised to the default value, which is a
     * single category called "general". This migration will set the category
     * field on any existing equipment.
     */
    setEquipmentCategory: (data: any, updateData: any) => {
      if (
        data.type === c.equipment &&
        isNullOrEmptyString(data.data?.category)
      ) {
        logger.info(`Migrating item ${data.name} to set category`);
        if (!updateData.data) {
          updateData.data = {};
        }
        updateData.data.category = Object.keys(
          pathOfCthulhuPreset.equipmentCategories,
        )[0];
      }
      return updateData;
    },
  },
  actor: {
    /**
     * We used to use an array of strings as our "short notes". We have now
     * upgraded these to fuill items so they can given descriptions and images,
     * included in compendiums etc. This migration will turn any exsiting
     * text-based short notes into new personalDetail items.
     */
    turnShortNotesIntoPersonalDetails: (data: any, updateData: any) => {
      if (data.type === c.pc && data.data?.shortNotes) {
        logger.info(
          `Migrating actor ${data.name} to turn short notes into personal details`,
        );
        if (!updateData.data) {
          updateData.data = {};
        }
        const shortNoteItems = data.data.shortNotes
          .map((shortNote: string, i: number) => ({
            type: c.personalDetail,
            img: c.personalDetailIcon,
            name: shortNote,
            system: {
              index: i,
            },
          }))
          .filter((item: any) => item.name !== null);
        const occupationItem = isNullOrEmptyString(data.data.occupation)
          ? []
          : [
              {
                type: c.personalDetail,
                img: c.personalDetailIcon,
                name: data.data.occupation,
                system: {
                  index: c.occupationSlotIndex,
                },
              },
            ];
        updateData.items = (updateData.items ?? [])
          .concat(shortNoteItems)
          .concat(occupationItem);
      }
      return updateData;
    },
  },
  world: {},
  compendium: {},
  journal: {},
  macro: {},
  scene: {},
  rollTable: {},
  playlist: {},
};
