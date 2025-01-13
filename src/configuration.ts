import { InvestigatorActor } from "./module/InvestigatorActor";
import { InvestigatorCombat } from "./module/InvestigatorCombat";
import { InvestigatorCombatant } from "./module/InvestigatorCombatant";
import { InvestigatorItem } from "./module/InvestigatorItem";
import { NPCSystemData, PartySystemData, PCSystemData } from "./types";

interface PCDataSource {
  type: "pc";
  system: PCSystemData;
}

interface NPCDataSource {
  type: "npc";
  system: NPCSystemData;
}

interface PartyDataSource {
  type: "party";
  system: PartySystemData;
}

type InvestigatorActorDataSource =
  | PCDataSource
  | NPCDataSource
  | PartyDataSource;

// interface EquipmentDataSource {
//   type: "equipment";
//   system: EquipmentSystemData;
// }

// interface WeaponDataSource {
//   type: "weapon";
//   system: WeaponSystemData;
// }

// interface CardDataSource {
//   type: "card";
//   system: CardSystemData;
// }

// interface GeneralAbilityDataSource {
//   type: "generalAbility";
//   system: GeneralAbilitySystemData;
// }

// interface InvestigativeAbilityDataSource {
//   type: "investigativeAbility";
//   system: InvestigativeAbilitySystemData;
// }

// interface PersonalDetailDataSource {
//   type: "personalDetail";
//   system: PersonalDetailSystemData;
// }

// type InvestigatorItemDataSource =
// |EquipmentDataSource
// | WeaponDataSource
// | CardDataSource
// | GeneralAbilityDataSource
// | InvestigativeAbilityDataSource
// | PersonalDetailDataSource;

declare global {
  interface DocumentClassConfig {
    Actor: typeof InvestigatorActor;
    Item: typeof InvestigatorItem;
    Combat: typeof InvestigatorCombat;
    Combatant: typeof InvestigatorCombatant;
  }
  interface SourceConfig {
    Actor: InvestigatorActorDataSource;
    // Item: InvestigatorItemDataSource;
  }
}

export function testActorFunction(actor: Actor) {
  console.log(actor.data.data);
}
