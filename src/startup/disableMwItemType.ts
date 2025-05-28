import { settingsSaved } from "../constants";
import { assertGame } from "../functions/utilities";
import { settings } from "../settings/settings";

let oldMwItemTypelabel: string | null = null;
let oldMwItemIndex: number | null = null;

/**
 * Remove or add the moribund-world-specific item type
 */
function mwItemOnOrOff() {
  assertGame(game);
  if (settings.mwUseAlternativeItemTypes.get()) {
    if (oldMwItemTypelabel !== null && oldMwItemIndex !== null) {
      CONFIG.Item.typeLabels.mwItem = oldMwItemTypelabel;
      game.documentTypes.Item.splice(oldMwItemIndex, 0, "mwItem");
      oldMwItemTypelabel = null;
      oldMwItemIndex = null;
    }
  } else {
    const label = CONFIG.Item.typeLabels.mwItem;
    const index = game.documentTypes.Item.indexOf("mwItem");
    if (index !== -1) {
      oldMwItemTypelabel = label;
      // @ts-expect-error .type
      delete CONFIG.Item.typeLabels.mwItem;
      oldMwItemIndex = index;
      game.documentTypes.Item.splice(index, 1);
    }
  }
}

export const handleMwItemType = () => {
  // see https://github.com/foundryvtt/foundryvtt/issues/6977
  // hook handlers registered with `.once` and `.on` exhibit the "once"
  // behaviour for the "on" registration. This can be fixed by wrapping the
  // handler in an anon function. technically you'd only need to do this to one
  // or the other.
  Hooks.once("ready", () => {
    mwItemOnOrOff();
  });
  Hooks.on(settingsSaved, () => {
    mwItemOnOrOff();
  });
};
