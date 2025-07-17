import { Token } from "../fvtt-exports";
import { migrateActorData } from "./migrateActorData";
import { FlaggedMigrations } from "./types";

/**
 * Migrate a single Scene entity to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {Object} scene  The Scene data to Update
 * @return {Object}       The updateData to apply
 *
 * XXX the current Scene type isn't up to scratch
 */
export const migrateSceneData = function (
  scene: any,
  flaggedMigrations: FlaggedMigrations,
) {
  const tokens = foundry.utils.deepClone(scene.tokens);
  return {
    tokens: tokens.map((t: any) => {
      if (!t.actorId || t.actorLink || !t.actorData) {
        t.actorData = {};
        return t;
      }
      const token = new Token(t);
      if (!token.actor) {
        t.actorId = null;
        t.actorData = {};
      } else if (!t.actorLink) {
        const updateData = migrateActorData(token.actor, flaggedMigrations);
        t.actorData = foundry.utils.mergeObject(token.actor, updateData);
      }
      return t;
    }),
  };
};
