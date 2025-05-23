// at one point I had to have this to make the
// `declare module "fvtt-types/configuration"` below work, but thaty may have
// been when we were on fvtt-types#main with the new stuff for config
// import "fvtt-types/configuration";

import { PersonalDetail } from "@lumphammer/investigator-fvtt-types";

import * as constants from "./constants";
import { NPCModel } from "./module/actors/npc";
import { PartyModel } from "./module/actors/party";
import { PCModel } from "./module/actors/pc";
import { InvestigatorActor } from "./module/InvestigatorActor";
import { InvestigatorCombat } from "./module/InvestigatorCombat";
import { InvestigatorCombatant } from "./module/InvestigatorCombatant";
import { InvestigatorItem } from "./module/InvestigatorItem";
import {
  CardSystemData,
  EquipmentSystemData,
  GeneralAbilitySystemData,
  InvestigativeAbilitySystemData,
  PersonalDetailSystemData,
  WeaponSystemData,
} from "./types";

interface EquipmentDataSource {
  type: typeof constants.equipment;
  system: EquipmentSystemData;
}

interface WeaponDataSource {
  type: typeof constants.weapon;
  system: WeaponSystemData;
}

interface CardDataSource {
  type: typeof constants.card;
  system: CardSystemData;
}

interface GeneralAbilityDataSource {
  type: typeof constants.generalAbility;
  system: GeneralAbilitySystemData;
}

interface InvestigativeAbilityDataSource {
  type: typeof constants.investigativeAbility;
  system: InvestigativeAbilitySystemData;
}

interface PersonalDetailDataSource {
  type: typeof constants.personalDetail;
  system: PersonalDetailSystemData;
}

type InvestigatorItemDataSource =
  | EquipmentDataSource
  | WeaponDataSource
  | CardDataSource
  | GeneralAbilityDataSource
  | InvestigativeAbilityDataSource
  | PersonalDetailDataSource;

declare module "fvtt-types/configuration" {
  interface DataModelConfig {
    Actor: {
      pc: typeof PCModel;
      npc: typeof NPCModel;
      party: typeof PartyModel;
    };
  }
  interface ConfiguredActor<SubType extends Actor.SubType> {
    document: InvestigatorActor<SubType>;
  }
}

declare module "fvtt-types/configuration" {
  interface DocumentClassConfig {
    Actor: typeof InvestigatorActor;
    Item: typeof InvestigatorItem;
    Combat: typeof InvestigatorCombat;
    Combatant: typeof InvestigatorCombatant;
  }
  interface SourceConfig {
    Item: InvestigatorItemDataSource;
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
