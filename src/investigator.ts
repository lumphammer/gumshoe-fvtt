import "./investigator.less";
import { systemName } from "./constants";
import { registerSettingsMenu } from "./startup/registerSettingsMenu";
import { preloadTemplates } from "./startup/preloadTemplates";
import { initializePackGenerators } from "./compendiumFactory/generatePacks";
import { installCompendiumExportButton } from "./startup/installCompendiumExportButton";
import { installShowThemeFarmHack } from "./startup/installShowThemeFarmHack";
import { installAbilityCardChatWrangler } from "./startup/installAbilityCardChatWrangler";
import { migrateWorldIfNeeded } from "./startup/migrateWorldIfNeeded";
import { installAbilityCategoryHookHandler } from "./startup/installAbilityCategoryHookHandler";
import { installItemImageHookHandler } from "./startup/installItemImageHookHandler";
import { installDSNFix } from "./startup/installDSNFix";
import { registerSheetsAndClasses } from "./startup/registerSheetsAndClasses";
import { registerBabele } from "./startup/registerBabele";
import { installRenderSettingsHandler } from "./startup/installRenderSettingsHandler";
import { installDropActorSheetDataHandler } from "./startup/installDropActorSheetDataHandler";
import { registerDevModeDebugFlag } from "./startup/registerDevModeDebugFlag";
import { installActorImageHookHandler } from "./startup/installActorImageHookHandler";
import { injectGlobalHelper } from "./startup/injectGlobalHelper";
import { loadCustomThemes } from "./startup/loadCustomThemes";
import { handleMwItemType } from "./startup/disableMwItemType";
import { installInitiativeUpdateHookHandler } from "./startup/installInitiativeUpdateHookHandler";
import { assertGame } from "./functions";
import { installTurnPassingHandler } from "./startup/installTurnPassingHandler";
import { installSocketActionHandler } from "./startup/installSocketActionHandler";
import { installEquipmentCategoryHookHandler } from "./startup/installEquipmentCategoryHookHandler";
import { installPersonalDetailHookHandler } from "./startup/installPersonalDetailHookHandler";
import { installResourceUpdateHookHandler } from "./startup/installResourceUpdateHookHandler";
import { installNewCharacterPacksHookHandler } from "./startup/installNewCharacterPacksHookHandler";

injectGlobalHelper();

// Initialize system
Hooks.once("init", async function () {
  logger.log(`${systemName} | Initializing system`);
  registerSettingsMenu();
  await preloadTemplates();
  registerSheetsAndClasses();
  registerBabele();
});

// Setup system
Hooks.once("setup", function () {
  installShowThemeFarmHack();
});

Hooks.once("ready", () => {
  migrateWorldIfNeeded();
  installDSNFix();

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
