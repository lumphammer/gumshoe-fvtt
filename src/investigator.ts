// ned to bring in these global types manually
import "@lumphammer/shared-fvtt-bits/src/ApplicationV2Types";

// import { DummyAppV2 } from "@lumphammer/shared-fvtt-bits/src/DummyAppV2";
import { DummyAppV2WithMixin } from "@lumphammer/shared-fvtt-bits/src/DummyAppV2WithMixin";

import { initializePackGenerators } from "./compendiumFactory/generatePacks";
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
import { preloadTemplates } from "./startup/preloadTemplates";
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
Hooks.once("init", async function () {
  systemLogger.log(`Initializing ${systemId} system`);
  registerSettingsMenu();
  await preloadTemplates();
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
initializePackGenerators();
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

Hooks.on("ready", async () => {
  // const dummyAppV2 = new DummyAppV2({
  //   window: {
  //     frame: true,
  //     positioned: true,
  //     title: "Dummy App V2",
  //     // @ts-expect-error resizable is not a valid property
  //     resizable: true,
  //     width: 800,
  //     height: 600,
  //   },
  //   position: {
  //     width: 800,
  //     height: 600,
  //   },
  // });
  // await dummyAppV2.render(true);
  const dummyAppV2WithMixin = new DummyAppV2WithMixin({
    // window: {
    //   frame: true,
    //   positioned: true,
    //   title: "Dummy App V2 With Mixin",
    //   // @ts-expect-error resizable is not a valid property
    //   resizable: true,
    //   width: 800,
    //   height: 600,
    // },
    // position: {
    //   width: 800,
    //   height: 600,
    // },
  });
  await dummyAppV2WithMixin.render(true);
});
