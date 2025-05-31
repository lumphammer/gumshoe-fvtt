// import { DummyAppV2 } from "@lumphammer/shared-fvtt-bits/src/DummyAppV2";
// import { DummyAppV2WithMixin } from "@lumphammer/shared-fvtt-bits/src/DummyAppV2WithMixin";
import { systemId } from "./constants";
import { assertGame, systemLogger } from "./functions/utilities";
import processedStyles from "./investigator.less?inline";
import { handleMwItemType } from "./startup/disableMwItemType";
import { injectGlobalHelper } from "./startup/injectGlobalHelper";
import { installAbilityCardChatWrangler } from "./startup/installAbilityCardChatWrangler";
import { installAbilityCategoryHookHandler } from "./startup/installAbilityCategoryHookHandler";
import { installActorCombatAbilityHandler } from "./startup/installActorCombatAbilityHandler";
import { installActorImageHookHandler } from "./startup/installActorImageHookHandler";
import { installCardCategoryHookHandler } from "./startup/installCardCategoryHookHandler";
import { installCompendiumExportButton } from "./startup/installCompendiumExportButton";
import { installDropActorSheetDataHandler } from "./startup/installDropActorSheetDataHandler";
import { installDSNFix } from "./startup/installDSNFix";
import { installEquipmentAddedNotifier } from "./startup/installEquipmentAddedNotifier";
import { installEquipmentCategoryHookHandler } from "./startup/installEquipmentCategoryHookHandler";
import { installInitiativeUpdateHookHandler } from "./startup/installInitiativeUpdateHookHandler";
import { installItemCombatAbilityHandler } from "./startup/installItemCombatAbilityHandler";
import { installItemImageHookHandler } from "./startup/installItemImageHookHandler";
import { installKeepTokenImageInSyncWithActor } from "./startup/installKeepTokenImageInSyncWithActor";
import { installNewCharacterDefaultOccupationHookHandler } from "./startup/installNewCharacterDefaultOccupationHookHandler";
import { installNewCharacterPacksHookHandler } from "./startup/installNewCharacterPacksHookHandler";
import { installPersonalDetailHookHandler } from "./startup/installPersonalDetailHookHandler";
import { installRenderSettingsHandler } from "./startup/installRenderSettingsHandler";
import { installResourceUpdateHookHandler } from "./startup/installResourceUpdateHookHandler";
import { installShowThemeFarmHack } from "./startup/installShowThemeFarmHack";
import { installSocketActionHandler } from "./startup/installSocketActionHandler";
import { installTurnPassingHandler } from "./startup/installTurnPassingHandler";
import { loadCustomThemes } from "./startup/loadCustomThemes";
import { migrateWorldIfNeeded } from "./startup/migrateWorldIfNeeded";
import { registerBabele } from "./startup/registerBabele";
import { registerDevModeDebugFlag } from "./startup/registerDevModeDebugFlag";
import { registerSettingsMenu } from "./startup/registerSettingsMenu";
import { registerSheetsAndClasses } from "./startup/registerSheetsAndClasses";

// @emotion/react 11.13 introduced a ~breaking change that labelling is now
// opt-in. There are good perf reasons for this, but personally I like it
// see https://emotion.sh/docs/labels#automatic-labeling-at-runtime
// see https://github.com/emotion-js/emotion/blob/main/packages/react/CHANGELOG.md#11120
// @ts-expect-error nonstandard global
globalThis.EMOTION_RUNTIME_AUTO_LABEL = true;

injectGlobalHelper();

// Inject CSS
// normal css imports don't work in foundry because the html is loaded from
// foundry itself and vite's css injection never kicks in. So we have to
// import the css as a string and inject it ourselves.
const styleElement = document.createElement("style");
styleElement.innerHTML = processedStyles;
document.head.appendChild(styleElement);

// Initialize system
Hooks.once("init", function () {
  systemLogger.log(`Initializing ${systemId} system`);
  registerSettingsMenu();
  registerSheetsAndClasses();
  registerBabele();
});

// Setup system
Hooks.once("setup", function () {
  installShowThemeFarmHack();
});

Hooks.once("ready", async () => {
  await migrateWorldIfNeeded();
  await installDSNFix();

  assertGame(game);
  for (const combat of game.combats?.values() ?? []) {
    combat.setupTurns();
  }
});

installAbilityCategoryHookHandler();
installItemImageHookHandler();
installRenderSettingsHandler();
installDropActorSheetDataHandler();
registerDevModeDebugFlag();
installActorImageHookHandler();
installCompendiumExportButton();
installAbilityCardChatWrangler();
loadCustomThemes();
handleMwItemType();
installInitiativeUpdateHookHandler();
installTurnPassingHandler();
installSocketActionHandler();
installEquipmentCategoryHookHandler();
installPersonalDetailHookHandler();
installResourceUpdateHookHandler();
installNewCharacterPacksHookHandler();
installKeepTokenImageInSyncWithActor();
installNewCharacterDefaultOccupationHookHandler();
installEquipmentAddedNotifier();
installCardCategoryHookHandler();
installItemCombatAbilityHandler();
installActorCombatAbilityHandler();

/**
 * Recursively get all layer names from a CSSRule and its children.
 */
function getLayerNamesFromRule(rule: CSSRule): string[] {
  if (rule instanceof CSSLayerStatementRule) {
    return Array.from(rule.nameList);
  }
  if (rule instanceof CSSGroupingRule) {
    const childRules = Array.from(rule.cssRules).flatMap((r) =>
      getLayerNamesFromRule(r),
    );
    if (rule instanceof CSSLayerBlockRule) {
      childRules.unshift(rule.name);
    }
    return childRules;
  }
  return [];
}

/**
 * Get all layer names from all stylesheets in the document, in reverse order of
 * declaration (last declared is first).
 */
function getAllLayerNamesInDocument(): string[] {
  const layerNames = Array.from(document.styleSheets)
    .flatMap((sheet) => Array.from(sheet.cssRules))
    .flatMap(getLayerNamesFromRule);
  const setOfLayerNames = new Set(layerNames);
  const reversed = Array.from(setOfLayerNames.values()).toReversed();
  return reversed;
}

/**
 * Given a list of layer names in reverse declaration order, sort them so that
 * child layers are under parent layers (reflecting how CSS layers work).
 */
function sortLayersIntoEffectivePriorityOrder(layerNames: string[]): string[] {
  const singles = layerNames.filter((name) => !name.includes("."));
  const multis = layerNames.filter((name) => name.includes("."));
  const result = singles
    .flatMap((name): string[] => {
      const kids = multis.filter((m) => m.startsWith(name));
      const kidsTrimmed = kids.map((k) => k.slice(name.length + 1));
      const kidsSorted = sortLayersIntoEffectivePriorityOrder(kidsTrimmed);
      const kidsWithPrefix = kidsSorted.map((k) => `${name}.${k}`);
      return [name, ...kidsWithPrefix];
    })
    .map((name: string) => {
      // indent by two spaces per dot in the name (which == nesting level)
      const dotCount = name.split(".").length - 1;
      const padding = " ".repeat(dotCount * 2);
      return `${padding}${name}`;
    });
  return result;
}

Hooks.once("ready", () => {
  const names = sortLayersIntoEffectivePriorityOrder(
    getAllLayerNamesInDocument(),
  );

  systemLogger.log(
    "All CSS Cascade Layers currently in document (highest priority first):\n" +
      "======================================================================\n" +
      "%s",
    names.join("\n"),
  );
});
