import * as constants from "../constants";
import { InvestigatorActor } from "../module/InvestigatorActor";
import { InvestigatorCombat } from "../module/InvestigatorCombat";
import { InvestigatorCombatant } from "../module/InvestigatorCombatant";
import { InvestigatorCombatTracker } from "../module/InvestigatorCombatTracker";
import { InvestigatorItem } from "../module/InvestigatorItem";
import { ItemSheetClass } from "../module/InvestigatorItemSheetClass";
// eslint-disable-next-line unused-imports/no-unused-imports
import { ItemSheetV2Class } from "../module/InvestigatorItemSheetV2Class";
import { InvestigatorJournalSheet } from "../module/InvestigatorJournalSheet";
import { InvestigatorTokenDocument } from "../module/InvestigatorTokenDocument";
import { JournalEditorSheetClass } from "../module/JournalEditorSheetClass";
import { NPCSheetClass } from "../module/NPCSheetClass";
// eslint-disable-next-line unused-imports/no-unused-imports
import { NPCSheetClassV2 } from "../module/NPCSheetClassV2";
import { PartySheetClass } from "../module/PartySheetClass";
import { PCSheetClass } from "../module/PCSheetClass";
// eslint-disable-next-line unused-imports/no-unused-imports
import { PCSheetClassV2 } from "../module/PCSheetClassV2";
export const registerSheetsAndClasses = () => {
  CONFIG.Actor.documentClass = InvestigatorActor;
  CONFIG.Item.documentClass = InvestigatorItem;
  CONFIG.Combatant.documentClass = InvestigatorCombatant;
  CONFIG.Combat.documentClass = InvestigatorCombat;
  // CONFIG.ChatMessage.documentClass = InvestigatorChatMessage;
  CONFIG.Token.documentClass = InvestigatorTokenDocument;
  CONFIG.ui.combat = InvestigatorCombatTracker;

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

  // Items.registerSheet(constants.systemId, ItemSheetV2Class, {
  //   makeDefault: false,
  //   types: [
  //     constants.weapon,
  //     constants.equipment,
  //     constants.investigativeAbility,
  //     constants.generalAbility,
  //     constants.mwItem,
  //     constants.personalDetail,
  //     constants.card,
  //   ],
  // });
  // Actors.registerSheet(constants.systemId, NPCSheetClassV2, {
  //   makeDefault: false,
  //   types: [constants.npc],
  // });
  // Actors.registerSheet(constants.systemId, PCSheetClassV2, {
  //   makeDefault: false,
  //   types: [constants.pc],
  // });
};
