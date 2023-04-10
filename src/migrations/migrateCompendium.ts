import { migrateActorData } from "./migrateActorData";
import { migrateItemData } from "./migrateItemData";
import { migrateSceneData } from "./migrateSceneData";
import system from "../../public/system.json";
import { FlaggedMigrations } from "./types";

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function (
  pack: any,
  flaggedMigrations: FlaggedMigrations,
) {
  const entity = pack.metadata.entity;

  for (const packMigration in flaggedMigrations.compendium) {
    flaggedMigrations.compendium[packMigration](pack, entity);
  }

  if (!["Actor", "Item", "Scene"].includes(entity)) return;

  // Unlock the pack for editing
  const wasLocked = pack.locked;
  await pack.configure({ locked: false });

  // Begin by requesting server-side data model migration and get the migrated content
  await pack.migrate();
  const content = await pack.getDocuments();

  // Iterate over compendium entries - applying fine-tuned migration functions
  for (const ent of content) {
    let updateData: any = {};
    try {
      switch (entity) {
        case "Actor":
          updateData = migrateActorData(ent.data, flaggedMigrations);
          break;
        case "Item":
          updateData = migrateItemData(ent.data, flaggedMigrations);
          break;
        case "Scene":
          updateData = migrateSceneData(ent.data, flaggedMigrations);
          break;
      }
      if (isObjectEmpty(updateData)) continue;

      // Save the entry, if data was changed
      updateData._id = ent.id;
      await ent.update(updateData);
      console.log(
        `Migrated ${entity} entity ${ent.name} in Compendium ${pack.collection}`,
      );
    } catch (err: any) {
      // Handle migration failures
      err.message = `Failed ${system.title} system migration for entity ${ent.name} in pack ${pack.collection}: ${err.message}`;
      console.error(err);
    }
  }

  // Apply the original locked status for the pack
  pack.configure({ locked: wasLocked });
  console.log(
    `Migrated all ${entity} entities from Compendium ${pack.collection}`,
  );
};
