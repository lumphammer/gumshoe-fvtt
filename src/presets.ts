import { PresetV1 } from "@lumphammer/investigator-fvtt-types";
import { packNames, systemName, npcPackName } from "./constants";

export const pathOfCthulhuPreset: Required<PresetV1> = {
  schemaVersion: "v1",
  displayName: "Path of Cthulhu",
  defaultThemeName: "tealTheme",
  investigativeAbilityCategories: ["Academic", "Interpersonal", "Technical"],
  generalAbilityCategories: ["General"],
  combatAbilities: ["Scuffling", "Weapons", "Firearms", "Athletics"],
  occupationLabel: "Occupation",
  personalDetails: [{ name: "Drive", type: "item" }],
  longNotes: [
    "Notes, Contacts etc.",
    "Occupational Benefits",
    "Pillars of Sanity",
    "Sources of Stability",
  ],
  newPCPacks: [`${systemName}.${packNames.pathOfCthulhuAbilities}`],
  newNPCPacks: [`${systemName}.${npcPackName}`],
  useBoost: false,
  useMwStyleAbilities: false,
  mwUseAlternativeItemTypes: false,
  useMwInjuryStatus: false,
  genericOccupation: "Investigator",
  mwHiddenShortNotes: [],
  showEmptyInvestigativeCategories: false,
  useHitThreshold: true,
  pcStats: {
    hitThreshold: {
      name: "Hit threshold",
      default: 3,
    },
  },
  npcStats: {
    hitThreshold: {
      name: "Hit threshold",
      default: 3,
    },
    armor: {
      name: "Armor",
      default: 0,
    },
    alertness: {
      name: "Alertness",
      default: 0,
    },
    stealth: {
      name: "Stealth",
      default: 0,
    },
    stabilityLoss: {
      name: "Stability Loss",
      default: 0,
    },
  },
  useNpcCombatBonuses: false,
  useTurnPassingInitiative: false,
  equipmentCategories: {
    general: {
      name: "General",
      fields: {},
    },
    // jqx7v_b6gq$agk440wrca: {
    //   name: "Spells",
    //   fields: {
    //     ctgl8__c9bqkyecw9bnra: {
    //       name: "Type",
    //       type: "string",
    //       default: "",
    //     },
    //   },
    // },
    // q5_505vww9i1bok$i4od8: {
    //   name: "Tomes",
    //   fields: {},
    // },
  },
};

export const niceBlackAgentsPreset: PresetV1 = {
  schemaVersion: "v1",
  displayName: "Nice Black Agents",
  defaultThemeName: "niceTheme",
  investigativeAbilityCategories: ["Academic", "Interpersonal", "Technical"],
  generalAbilityCategories: ["General"],
  combatAbilities: ["Hand-to-Hand", "Weapons", "Shooting", "Athletics"],
  occupationLabel: "Background",
  personalDetails: [
    { name: "Drive", type: "item" },
    { name: "Previous Patron", type: "item" },
  ],
  longNotes: ["Covers", "Network Contacts", "Trust"],
  newPCPacks: [`${systemName}.${packNames.niceBlackAgentsAbilities}`],
  newNPCPacks: [`${systemName}.${npcPackName}`],
  useBoost: false,
  useMwStyleAbilities: false,
  mwUseAlternativeItemTypes: false,
  useMwInjuryStatus: false,
  genericOccupation: "Investigator",
  pcStats: pathOfCthulhuPreset.pcStats,
  npcStats: pathOfCthulhuPreset.npcStats,
  equipmentCategories: { general: { name: "General", fields: {} } },
};

export const nothingToFearPreset: PresetV1 = {
  schemaVersion: "v1",
  displayName: "Nothing to Fear",
  defaultThemeName: "fearTheme",
  investigativeAbilityCategories: [
    "Academic",
    "Interpersonal",
    "Technical",
    "Psychic Powers",
  ],
  generalAbilityCategories: ["General"],
  combatAbilities: ["Scuffling", "Shooting", "Athletics"],
  occupationLabel: "Concept",
  personalDetails: [],
  longNotes: ["Risk Factors", "Sources of Stability", "Notes"],
  newPCPacks: [`${systemName}.${packNames.nothingToFearAbilities}`],
  newNPCPacks: [`${systemName}.${npcPackName}`],
  useBoost: false,
  useMwStyleAbilities: false,
  mwUseAlternativeItemTypes: false,
  useMwInjuryStatus: false,
  genericOccupation: "Investigator",
  pcStats: pathOfCthulhuPreset.pcStats,
  npcStats: pathOfCthulhuPreset.npcStats,
  equipmentCategories: { general: { name: "General", fields: {} } },
};

export const pallidStarsPreset: PresetV1 = {
  schemaVersion: "v1",
  displayName: "Pallid Stars",
  defaultThemeName: "pallidTheme",
  investigativeAbilityCategories: [
    "Academic",
    "Interpersonal",
    "Technical",
    "Special",
  ],
  generalAbilityCategories: ["General"],
  combatAbilities: ["Scuffling", "Shooting"],
  occupationLabel: "Species",
  personalDetails: [
    { name: "Drive", type: "item" },
    { name: "Groundside Post", type: "item" },
    { name: "Warpside Post", type: "item" },
  ],
  longNotes: [
    "Personal Arc",
    "Cybernetic Enhancements",
    "Viroware Enhancements",
    "What You Did During The War",
  ],
  newPCPacks: [`${systemName}.${packNames.pallidStarsAbilities}`],
  newNPCPacks: [`${systemName}.${npcPackName}`],
  useBoost: true,
  useMwStyleAbilities: false,
  mwUseAlternativeItemTypes: false,
  useMwInjuryStatus: false,
  genericOccupation: "Investigator",
  pcStats: pathOfCthulhuPreset.pcStats,
  npcStats: pathOfCthulhuPreset.npcStats,
  equipmentCategories: {
    general: {
      name: "Gear",
      fields: {},
    },
    I5ujOaf_930T5m6XF59w0: {
      name: "Cybernetics",
      fields: {
        achu_d$31aq461l3pn1zs: {
          name: "Upkeep",
          type: "number",
          default: 0,
          min: 0,
        },
      },
    },
    omvQkNoORdSNhVgI42hYi: {
      name: "Virusware",
      fields: {
        YdjIcb6lTZpa07DynCO1C: {
          name: "Upkeep",
          type: "number",
          default: 0,
          min: 0,
        },
      },
    },
  },
};

export const castingTheRunesPreset: PresetV1 = {
  schemaVersion: "v1",
  displayName: "Casting the Runes",
  defaultThemeName: "antiquarianTheme",
  investigativeAbilityCategories: ["Academic", "Interpersonal", "Technical"],
  generalAbilityCategories: ["General"],
  combatAbilities: ["Scuffling", "Weapons"],
  occupationLabel: "Occupation",
  personalDetails: [{ name: "Drive", type: "item" }],
  longNotes: [
    "Income",
    "Contacts",
    "Magic",
    "Sources of Stability",
    "Things Encountered",
  ],
  newPCPacks: [`${systemName}.${packNames.castingTheRunesAbilities}`],
  newNPCPacks: [`${systemName}.${npcPackName}`],
  useBoost: false,
  useMwStyleAbilities: false,
  mwUseAlternativeItemTypes: false,
  useMwInjuryStatus: false,
  genericOccupation: "Investigator",
  pcStats: pathOfCthulhuPreset.pcStats,
  npcStats: pathOfCthulhuPreset.npcStats,
  equipmentCategories: { general: { name: "General", fields: {} } },
};

export const moribundWorldPreset: PresetV1 = {
  schemaVersion: "v1",
  displayName: "Moribund World",
  defaultThemeName: "olderThanMemoryTheme",
  investigativeAbilityCategories: [],
  generalAbilityCategories: [
    "Persuade",
    "Rebuff",
    "Attack",
    "Defense",
    "Resist",
    "Magic",
    "Health",
    "General",
  ],
  combatAbilities: [
    "Strength",
    "Speed",
    "Finesse",
    "Cunning",
    "Ferocity",
    "Caution",
  ],
  occupationLabel: "Précis",
  personalDetails: [{ name: "Series level", type: "item" }],
  longNotes: [
    "General",
    "Facial Features",
    "Hair",
    "Notable Mannerisms",
    "Costume",
  ],
  newPCPacks: [],
  newNPCPacks: [],
  useBoost: false,
  useMwStyleAbilities: true,
  mwUseAlternativeItemTypes: true,
  mwHiddenShortNotes: ["Sympathy points"],
  useMwInjuryStatus: true,
  genericOccupation: "Character",
  pcStats: pathOfCthulhuPreset.pcStats,
  npcStats: pathOfCthulhuPreset.npcStats,
};

export const basePresets = {
  pathOfCthulhuPreset,
  niceBlackAgentsPreset,
  nothingToFearPreset,
  pallidStarsPreset,
  castingTheRunesPreset,
  moribundWorldPreset,
};
