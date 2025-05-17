import system from "../public/system.json";

// we could use id from package, but the typings work better if this is
// constant typed
export const systemId = "investigator";
export const version = system.version;
export const defaultMigratedSystemVersion = "0.0.0";
export const defaultSystemPreset = "pathOfCthulhuPreset";
export const templatesPath = `systems/${systemId}/templates` as const;
export const reactTemplatePath =
  `${templatesPath}/react-application.hbs` as const;
export const customSystem = "customSystem";
export const genericOccupationDefault = "Investigator";
export const showEmptyInvestigativeCategoriesDefault = true;
export const inputThrottleTime = 500;

// item types
export const investigativeAbility = "investigativeAbility";
export const generalAbility = "generalAbility";
export const equipment = "equipment";
export const weapon = "weapon";
export const pc = "pc";
export const npc = "npc";
export const party = "party";
export const mwItem = "mwItem";
export const personalDetail = "personalDetail";
export const card = "card";

// assets
// all generated through https://game-icons.net/
export const investigativeAbilityIcon = `/systems/${systemId}/assets/icons/magnifying-glass.webp`;
export const generalAbilityIcon = `/systems/${systemId}/assets/icons/fist.webp`;
export const weaponIcon = `/systems/${systemId}/assets/icons/trench-knife.webp`;
export const equipmentIcon = `/systems/${systemId}/assets/icons/shopping-bag.webp`;
export const pcIcon = `/systems/${systemId}/assets/icons/sherlock-holmes.webp`;
export const npcIcon = `/systems/${systemId}/assets/icons/cowled.webp`;
export const partyIcon = `/systems/${systemId}/assets/icons/dark-squad.webp`;
export const personalDetailIcon = `/systems/${systemId}/assets/icons/notebook.webp`;
export const cardIcon = `/systems/${systemId}/assets/icons/card.webp`;

// packs

export const packNames = {
  niceBlackAgentsAbilities: "niceBlackAgentsAbilities",
  nothingToFearAbilities: "nothingToFearAbilities",
  pallidStarsAbilities: "pallidStarsAbilities",
  pathOfCthulhuAbilities: "pathOfCthulhuAbilities",
  srdAbilities: "srdAbilities",
  castingTheRunesAbilities: "castingTheRunesAbilities",
  moribundWorldAbilities: "moribundWorldAbilities",
  esoterroristsAbilities: "esoterroristsAbilities",
  niceBlackAgentsNPCAbilities: "niceBlackAgentsNPCAbilities",
  mutantCityBluesAbilities: "mutantCityBluesAbilities",
  mutantCityBluesNPCAbilities: "mutantCityBluesNPCAbilities",
  mutantCityBluesPowers: "mutantCityBluesPowers",
} as const;

export const npcPackName = "opponentAbilities";

// hooks
export const newPCPacksUpdated = `${systemId}.newPCPacksUpdated`;
export const newNPCPacksUpdated = `${systemId}.newNPCPacksUpdated`;
export const settingsSaved = `${systemId}.settingsSaved`;
export const requestTurnPass = `${systemId}.requestTurnPass`;
export const socketScope = `system.${systemId}`;
export const settingsCloseAttempted = `${systemId}.settingsCloseAttempted`;

// css classes
export const abilityChatMessageClassName = "investigator-ability-test";
export const htmlDataItemId = "data-item-id";
export const htmlDataActorId = "data-actor-id";
export const htmlDataMode = "data-mode";
export const htmlDataModeTest = "test";
export const htmlDataModeSpend = "spend";
export const htmlDataModeAttack = "attack";
export const htmlDataModeMwTest = "mw-test";
export const htmlDataModeMwWallop = "mw-wallop";
export const htmlDataModeMwNegate = "mw-negate";
export const htmlDataModePush = "push";
export const htmlDataRange = "data-range";
export const htmlDataWeaponId = "data-weapon-id";
export const htmlDataName = "data-name";
export const htmlDataImageUrl = "data-image-url";
export const htmlDataMwDifficulty = "data-mw-difficulty";
export const htmlDataMwBoonLevy = "data-mw-boon-levy";
export const htmlDataMwReRoll = "data-mw-re-roll";
export const htmlDataMwPool = "data-mw-pool";
export const htmlDataTokenId = "data-token-id";

// other?
export const mwWallopCost = 5;
export const mwNegateCost = 3;
export const defaultCustomThemePath = "investigator_themes";

// flags

export const passingTurnsRemaining = "passingTurnsRemaining";
export const extraPassingTurns = "extraPassingTurns";
export const extraCssClasses = "extraCssClasses";
export const journalMemories = "journalMemories";

// magic values

export const occupationSlotIndex = -1;
