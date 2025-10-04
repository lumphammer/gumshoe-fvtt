// this helps with getting declarations to work
// import "fvtt-types/configuration";

import { PersonalDetail } from "@lumphammer/investigator-fvtt-types";

import * as constants from "./constants";
import {
  ActorsCollection,
  Application,
  ItemsCollection,
  JournalCollection,
} from "./fvtt-exports";
import { InvestigatorActor } from "./module/actors/InvestigatorActor";
import { NPCModel } from "./module/actors/npc";
import { NPCSheetClass } from "./module/actors/NPCSheetClass";
import { PartyModel } from "./module/actors/party";
import { PartySheetClass } from "./module/actors/PartySheetClass";
import { PCModel } from "./module/actors/pc";
import { PCSheetClass } from "./module/actors/PCSheetClass";
import { ClassicCombatModel } from "./module/combat/classicCombat";
import { ClassicCombatantModel } from "./module/combat/classicCombatant";
import { InvestigatorCombat } from "./module/combat/InvestigatorCombat";
import { InvestigatorCombatant } from "./module/combat/InvestigatorCombatant";
import { InvestigatorCombatTracker } from "./module/combat/InvestigatorCombatTracker";
import { TurnPassingCombatModel } from "./module/combat/turnPassingCombat";
import { TurnPassingCombatantModel } from "./module/combat/turnPassingCombatant";
import { InvestigatorCompendiumDirectory } from "./module/InvestigatorCompendiumDirectory";
import { InvestigatorJournalSheet } from "./module/InvestigatorJournalSheet";
import { InvestigatorTokenDocument } from "./module/InvestigatorTokenDocument";
import { CardModel } from "./module/items/card";
import { EquipmentModel } from "./module/items/equipment";
import { GeneralAbilityModel } from "./module/items/generalAbility";
import { InvestigativeAbilityModel } from "./module/items/investigativeAbility";
import { InvestigatorItem } from "./module/items/InvestigatorItem";
import { ItemSheetClass } from "./module/items/InvestigatorItemSheetClass";
import { MwItemModel } from "./module/items/mwItem";
import { PersonalDetailModel } from "./module/items/personalDetail";
import { WeaponModel } from "./module/items/weapon";
import { JournalEntryHTMLEditorSheetClass } from "./module/JournalEditorSheetClass";
import type { RequestTurnPassArgs } from "./types";

// types configuration
declare module "fvtt-types/configuration" {
  interface SystemNameConfig {
    name: "investigator";
  }

  namespace foundry.documents.Combat {
    type SourceOfType<SubType extends Combat.SubType> = Omit<
      Combat.Source,
      "system"
    > & {
      system: Combat.OfType<SubType>["system"]["_source"];
    };
  }

  namespace Hooks {
    interface HookConfig {
      // our hooks
      [constants.newPCPacksUpdated]: (newPacks: string[]) => Promise<void>;
      [constants.requestTurnPass]: ({
        combatantId,
      }: RequestTurnPassArgs) => void;
      [constants.settingsSaved]: () => void;
      [constants.settingsCloseAttempted]: () => void;
      [constants.newNPCPacksUpdated]: (newPacks: string[]) => void;
      [constants.themeHMR]: (themeName: string) => void;

      // third-party hooks
      devModeReady: () => void;
      "PopOut:dialog": (
        dialoggedApp: Application,
        info: PopOut.DialogHookInfo,
      ) => void;
      "PopOut:popout": (poppedApp: Application, newWindow: Window) => void;
    }
  }

  interface DataModelConfig {
    Actor: {
      pc: typeof PCModel;
      npc: typeof NPCModel;
      party: typeof PartyModel;
    };
    Item: {
      equipment: typeof EquipmentModel;
      generalAbility: typeof GeneralAbilityModel;
      investigativeAbility: typeof InvestigativeAbilityModel;
      weapon: typeof WeaponModel;
      mwItem: typeof MwItemModel;
      personalDetail: typeof PersonalDetailModel;
      card: typeof CardModel;
    };
    Combat: {
      classic: typeof ClassicCombatModel;
      turnPassing: typeof TurnPassingCombatModel;
    };
    Combatant: {
      classic: typeof ClassicCombatantModel;
      turnPassing: typeof TurnPassingCombatantModel;
    };
  }

  interface ConfiguredActor<SubType extends Actor.SubType> {
    document: InvestigatorActor<SubType>;
  }

  interface ConfiguredItem<SubType extends Item.SubType> {
    document: InvestigatorItem<SubType>;
  }

  interface DocumentClassConfig {
    Actor: typeof InvestigatorActor;
    Item: typeof InvestigatorItem;
    Combat: typeof InvestigatorCombat;
    Combatant: typeof InvestigatorCombatant;
  }

  interface FlagConfig {
    JournalEntry: {
      investigator: {
        extraCssClasses: string;
      };
    };
    JournalEntryPage: {
      investigator: {
        extraCssClasses: string;
      };
    };
  }
  // this is not complete, because most of our settings are handled through our
  // own settings system (which is backed by game.settings but has its own
  // types). These declarations are just enough for the cases where we use
  // game.settings directly.
  interface SettingConfig {
    "investigator.personalDetails": PersonalDetail[];
    "investigator.shortNotes": string[];
    "dice-so-nice.enabledSimultaneousRollForMessage": boolean;
    "dice-so-nice.enabledSimultaneousRolls": boolean;
  }

  namespace foundry.dice.terms.RollTerm {
    interface Options {
      rollOrder?: number;
    }
  }

  // fill in a type we need for InvestigatorCompendiumDirectory
  namespace foundry.applications.sidebar.tabs {
    // @ts-expect-error fvtt-types - when this errors, CompendiumDirectory has been typed
    type _T = CompendiumDirectory["_getFilterContextOptions"];

    interface CompendiumDirectory {
      _getEntryContextOptions(): foundry.applications.ux.ContextMenu.Entry<HTMLElement>[];
    }
  }
}

// runtime configuration
Hooks.once("init", function () {
  CONFIG.Actor.documentClass = InvestigatorActor;
  CONFIG.Item.documentClass = InvestigatorItem;
  CONFIG.Combatant.documentClass = InvestigatorCombatant;
  CONFIG.Combat.documentClass = InvestigatorCombat;
  // CONFIG.ChatMessage.documentClass = InvestigatorChatMessage;
  CONFIG.Token.documentClass = InvestigatorTokenDocument;
  CONFIG.ui.combat = InvestigatorCombatTracker;
  CONFIG.ui.compendium = InvestigatorCompendiumDirectory;

  CONFIG.Actor.dataModels["pc"] = PCModel;
  CONFIG.Actor.dataModels["npc"] = NPCModel;
  CONFIG.Actor.dataModels["party"] = PartyModel;

  CONFIG.Item.dataModels["equipment"] = EquipmentModel;
  CONFIG.Item.dataModels["generalAbility"] = GeneralAbilityModel;
  CONFIG.Item.dataModels["investigativeAbility"] = InvestigativeAbilityModel;
  CONFIG.Item.dataModels["weapon"] = WeaponModel;
  CONFIG.Item.dataModels["mwItem"] = MwItemModel;
  CONFIG.Item.dataModels["personalDetail"] = PersonalDetailModel;
  CONFIG.Item.dataModels["card"] = CardModel;

  CONFIG.Combat.dataModels["classic"] = ClassicCombatModel;
  CONFIG.Combat.dataModels["turnPassing"] = TurnPassingCombatModel;

  CONFIG.Combatant.dataModels["classic"] = ClassicCombatantModel;
  CONFIG.Combatant.dataModels["turnPassing"] = TurnPassingCombatantModel;

  // CONFIG.Combat.dataModels["investigator"] = InvestigatorCombat;

  // Register custom sheets

  // actors
  ActorsCollection.registerSheet(constants.systemId, NPCSheetClass, {
    makeDefault: true,
    types: [constants.npc],
  });
  ActorsCollection.registerSheet(constants.systemId, PCSheetClass, {
    makeDefault: true,
    types: [constants.pc],
  });
  ActorsCollection.registerSheet(constants.systemId, PartySheetClass, {
    makeDefault: true,
    types: [constants.party],
  });

  // items
  ItemsCollection.registerSheet(constants.systemId, ItemSheetClass, {
    makeDefault: false,
    types: [
      constants.weapon,
      constants.equipment,
      constants.investigativeAbility,
      constants.generalAbility,
      constants.mwItem,
      constants.personalDetail,
      constants.card,
    ],
  });

  // journals
  JournalCollection.registerSheet(
    "investigator",
    JournalEntryHTMLEditorSheetClass,
    {
      types: ["base"],
      makeDefault: false,
      label: "Investigator Journal HTML Editor",
    },
  );
  JournalCollection.registerSheet("investigator", InvestigatorJournalSheet, {
    types: ["base"],
    makeDefault: false,
    label: "Investigator Journal Sheet",
  });
});
