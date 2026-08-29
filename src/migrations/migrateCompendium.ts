import system from "../../public/system.json";
import { systemLogger } from "../functions/utilities";
import { createFailureCollector, describeDocument } from "./failures";
import { migrateActorData } from "./migrateActorData";
import { migrateItemData } from "./migrateItemData";
import { migrateSceneData } from "./migrateSceneData";
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
  const docType = pack.metadata.type;
  const { failures, record: recordFailure } = createFailureCollector();

  for (const packMigration in flaggedMigrations.compendium) {
    try {
      await flaggedMigrations.compendium[packMigration](pack, docType);
    } catch (error) {
      recordFailure(
        `migration ${packMigration} in pack ${pack.collection}`,
        error,
      );
    }
  }

  if (!["Actor", "Item", "Scene"].includes(docType)) {
    if (failures.length > 0) {
      throw new Error(
        `${system.title} system migration failed in pack ${pack.collection}: ${failures.join("; ")}`,
      );
    }
    return;
  }

  // Unlock the pack for editing
  const wasLocked = pack.locked;
  let lockChanged = false;
  try {
    await pack.configure({ locked: false });
    lockChanged = true;

    // Begin by requesting server-side data model migration and get the migrated content
    await pack.migrate();
    const content = await pack.getDocuments();

    // Iterate over compendium entries - applying fine-tuned migration functions
    for (const ent of content) {
      let updateData: any = {};
      try {
        switch (docType) {
          case "Actor":
            updateData = migrateActorData(ent, flaggedMigrations);
            break;
          case "Item":
            updateData = migrateItemData(ent, flaggedMigrations);
            break;
          case "Scene":
            updateData = migrateSceneData(ent, flaggedMigrations);
            break;
        }
        if (foundry.utils.isEmpty(updateData)) continue;

        // Save the entry, if data was changed
        updateData._id = ent.id;
        await ent.update(updateData);
        systemLogger.log(
          `Migrated ${docType} entity ${ent.name} in Compendium ${pack.collection}`,
        );
      } catch (error) {
        recordFailure(
          `${docType} ${describeDocument(ent)} in pack ${pack.collection}`,
          error,
        );
      }
    }
  } catch (error) {
    recordFailure(`pack ${pack.collection}`, error);
  } finally {
    if (lockChanged) {
      try {
        await pack.configure({ locked: wasLocked });
      } catch (error) {
        recordFailure(`restoring lock for pack ${pack.collection}`, error);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `${system.title} system migration failed in pack ${pack.collection}: ${failures.join("; ")}`,
    );
  }

  systemLogger.log(
    `Migrated all ${docType} entities from Compendium ${pack.collection}`,
  );
};
