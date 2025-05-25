/* eslint-disable unused-imports/no-unused-imports */
// at one point I had to have this to make the
// `declare module "fvtt-types/configuration"` below work, but thaty may have
// been when we were on fvtt-types#main with the new stuff for config
import "fvtt-types/configuration";

import { PersonalDetail } from "@lumphammer/investigator-fvtt-types";

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

declare module "fvtt-types/configuration" {
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
}
