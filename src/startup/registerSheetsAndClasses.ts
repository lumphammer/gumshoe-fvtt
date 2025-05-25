import * as constants from "../constants";
import { InvestigatorActor } from "../module/actors/InvestigatorActor";
import { NPCModel } from "../module/actors/npc";
import { NPCSheetClass } from "../module/actors/NPCSheetClass";
import { NPCSheetClassV2 } from "../module/actors/NPCSheetClassV2";
import { PartyModel } from "../module/actors/party";
import { PartySheetClass } from "../module/actors/PartySheetClass";
import { PCModel } from "../module/actors/pc";
import { PCSheetClass } from "../module/actors/PCSheetClass";
import { PCSheetClassV2 } from "../module/actors/PCSheetClassV2";
import { InvestigatorCombat } from "../module/InvestigatorCombat";
import { InvestigatorCombatant } from "../module/InvestigatorCombatant";
import { InvestigatorCombatTracker } from "../module/InvestigatorCombatTracker";
import { InvestigatorJournalSheet } from "../module/InvestigatorJournalSheet";
import { InvestigatorTokenDocument } from "../module/InvestigatorTokenDocument";
import { CardModel } from "../module/items/card";
import { EquipmentModel } from "../module/items/equipment";
import { GeneralAbilityModel } from "../module/items/generalAbility";
import { InvestigativeAbilityModel } from "../module/items/investigativeAbility";
import { InvestigatorItem } from "../module/items/InvestigatorItem";
import { ItemSheetClass } from "../module/items/InvestigatorItemSheetClass";
import { ItemSheetV2Class } from "../module/items/InvestigatorItemSheetV2Class";
import { MwItemModel } from "../module/items/mwItem";
import { PersonalDetailModel } from "../module/items/personalDetail";
import { WeaponModel } from "../module/items/weapon";
import { JournalEditorSheetClass } from "../module/JournalEditorSheetClass";

export const registerSheetsAndClasses = () => {
  CONFIG.Actor.documentClass = InvestigatorActor;
  CONFIG.Item.documentClass = InvestigatorItem;
  CONFIG.Combatant.documentClass = InvestigatorCombatant;
  CONFIG.Combat.documentClass = InvestigatorCombat;
  // CONFIG.ChatMessage.documentClass = InvestigatorChatMessage;
  CONFIG.Token.documentClass = InvestigatorTokenDocument;
  CONFIG.ui.combat = InvestigatorCombatTracker;

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

  // Register custom sheets (if any)
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet(constants.systemId, PCSheetClass, {
    makeDefault: true,
    types: [constants.pc],
  });
  Actors.registerSheet(constants.systemId, NPCSheetClass, {
    makeDefault: true,
    types: [constants.npc],
  });
  Actors.registerSheet(constants.systemId, PartySheetClass, {
    makeDefault: true,
    types: [constants.party],
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet(constants.systemId, ItemSheetClass, {
    makeDefault: true,
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
  Journal.registerSheet("investigator", JournalEditorSheetClass, {
    types: ["base"],
    makeDefault: false,
    label: "Investigator Journal Editor",
  });
  Journal.registerSheet("investigator", InvestigatorJournalSheet, {
    types: ["base"],
    makeDefault: false,
    label: "Investigator Journal Sheet",
  });

  // V2 sheets

  Items.registerSheet(constants.systemId, ItemSheetV2Class, {
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
  Actors.registerSheet(constants.systemId, NPCSheetClassV2, {
    makeDefault: false,
    types: [constants.npc],
  });
  Actors.registerSheet(constants.systemId, PCSheetClassV2, {
    makeDefault: false,
    types: [constants.pc],
  });
};
