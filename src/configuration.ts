// this helps with getting declarations to work
import "fvtt-types/configuration";

import { PersonalDetail } from "@lumphammer/investigator-fvtt-types";

import * as constants from "./constants";
import { InvestigatorActor } from "./module/actors/InvestigatorActor";
import { NPCModel } from "./module/actors/npc";
import { PartyModel } from "./module/actors/party";
import { PCModel } from "./module/actors/pc";
import { InvestigatorCombat } from "./module/InvestigatorCombat";
import { InvestigatorCombatant } from "./module/InvestigatorCombatant";
import { CardModel } from "./module/items/card";
import { EquipmentModel } from "./module/items/equipment";
import { GeneralAbilityModel } from "./module/items/generalAbility";
import { InvestigativeAbilityModel } from "./module/items/investigativeAbility";
import { InvestigatorItem } from "./module/items/InvestigatorItem";
import { MwItemModel } from "./module/items/mwItem";
import { PersonalDetailModel } from "./module/items/personalDetail";
import { WeaponModel } from "./module/items/weapon";
import type { RequestTurnPassArgs } from "./types";

declare module "fvtt-types/configuration" {
  interface SystemNameConfig {
    name: "investigator";
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
    Combat: {
      investigator: {
        activeTurnPassingCombatant: string | null;
      };
    };
    Combatant: {
      investigator: {
        passingTurnsRemaining: number;
      };
    };
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

declare module "fvtt-types/configuration" {}
