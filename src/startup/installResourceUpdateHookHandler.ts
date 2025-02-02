import { assertGame } from "../functions/utilities";
import { AnyItem, isGeneralAbilityItem } from "../v10Types";

export function installResourceUpdateHookHandler() {
  /**
   * Keep "special" general abilities in sync with their corresponding resources
   */
  Hooks.on(
    "updateItem",
    (
      item: AnyItem,
      diff: any,
      options: Record<string, unknown>,
      userId: string,
    ) => {
      assertGame(game);

      if (
        game.userId === userId &&
        item.actor &&
        item.name &&
        isGeneralAbilityItem(item) &&
        ["Sanity", "Stability", "Health", "Magic"].includes(item.name ?? "") &&
        (diff.system?.pool !== undefined || diff.system?.rating !== undefined)
      ) {
        void item.actor?.update({
          system: {
            resources: {
              [item.name.toLowerCase()]: {
                min: item.system.min,
                value: item.system.pool,
                max: item.system.rating,
              },
            },
          },
        });
      }
    },
  );
}
