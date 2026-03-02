import { NPCModel } from "./actors/npc";
import { PCModel } from "./actors/pc";
import { isActiveCharacterActor } from "./actors/types";

function getResourceIds(model: PCModel | NPCModel): string[] {
  const stats = Object.keys(model.stats).map((stat) => `stats.${stat}`);
  const resources = Object.keys(model.resources).map(
    (resource) => `resources.${resource}`,
  );
  return [...stats, ...resources];
}

/**
 * There's some foundrytude about resource attributes that aren't defined in
 * template.json. Now we're allowing abilities to define arbitrary resource ids
 * to sync with, we can't guarantee to define them all in template.json, but
 * when they're not there, they can't be edited through the token HUD.
 *
 * This override seems to be the fix.
 *
 * See https://discord.com/channels/732325252788387980/824055460386177064/1137110380573900901
 */
export class InvestigatorTokenDocument extends TokenDocument {
  static override getTrackedAttributes(
    data?: TokenDocument.TrackedAttributesSubject | null,
    _path?: string[],
  ): TokenDocument.TrackedAttributesDescription {
    // this function is very overloaded. when it's called from the Combat
    // Sidebar settings it's called with no arguments, and its job is to find
    // all the attributes that exist on the datamodels or template.json.
    // However, INVESTIGATOR uses dynamic attributes and so we need to override
    // it to walk all the world actors and find all their attributes.
    if (data === undefined && (_path?.length ?? 0) === 0) {
      const models: (PCModel | NPCModel)[] = (game.actors?.contents ?? [])
        .filter((a) => isActiveCharacterActor(a))
        .map((actor) => actor.system);

      const valueAttributesStrings = models.flatMap(getResourceIds);
      const valueAttributes = Array.from(new Set(valueAttributesStrings)).map(
        (attr) => attr.split("."),
      );
      return { bar: [], value: valueAttributes };
    } else if (data instanceof PCModel || data instanceof NPCModel) {
      const stats = Object.keys(data.stats).map((stat) => ["stats", stat]);

      const resources = Object.keys(data.resources).map((resource) => [
        "resources",
        resource,
      ]);

      return { bar: resources, value: stats };
    } else {
      return super.getTrackedAttributes(data, _path);
    }
  }

  getBarAttribute(barName: string, options: any = {}) {
    const result = super.getBarAttribute(barName, options);
    if (result && !result.editable) {
      result.editable = true;
    }
    return result;
  }
}
