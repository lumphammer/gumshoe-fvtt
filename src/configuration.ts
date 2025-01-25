import { PersonalDetail } from "@lumphammer/investigator-fvtt-types";

import * as constants from "./constants";
import { InvestigatorActor } from "./module/InvestigatorActor";
import { InvestigatorCombat } from "./module/InvestigatorCombat";
import { InvestigatorCombatant } from "./module/InvestigatorCombatant";
import { InvestigatorItem } from "./module/InvestigatorItem";
import {
  CardSystemData,
  EquipmentSystemData,
  GeneralAbilitySystemData,
  InvestigativeAbilitySystemData,
  NPCSystemData,
  PartySystemData,
  PCSystemData,
  PersonalDetailSystemData,
  WeaponSystemData,
} from "./types";

interface PCDataSource {
  type: typeof constants.pc;
  system: PCSystemData;
}

interface NPCDataSource {
  type: typeof constants.npc;
  system: NPCSystemData;
}

interface PartyDataSource {
  type: typeof constants.party;
  system: PartySystemData;
}

type InvestigatorActorDataSource =
  | PCDataSource
  | NPCDataSource
  | PartyDataSource;

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

declare global {
  interface DocumentClassConfig {
    Actor: typeof InvestigatorActor;
    Item: typeof InvestigatorItem;
    Combat: typeof InvestigatorCombat;
    Combatant: typeof InvestigatorCombatant;
  }
  interface SourceConfig {
    Actor: InvestigatorActorDataSource;
    Item: InvestigatorItemDataSource;
  }
  interface FlagConfig {
    JournalEntry: {
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
  }
}

// @ts-expect-error this is only on fvtt-types#main so far
declare module "fvtt-types/configuration" {
  namespace foundry.dice.terms.RollTerm {
    interface Options {
      rollOrder?: number;
    }
  }
}

export function testActorFunction(actor: Actor) {
  console.log(actor.system);
}
