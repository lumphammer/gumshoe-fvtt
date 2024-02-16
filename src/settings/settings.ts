import { PresetV1 } from "@lumphammer/investigator-fvtt-types";
import { z } from "zod";

import { DocumentMemoryCollection } from "../components/journalEditorSheet/documentMemory";
import * as c from "../constants";
import { mapValues } from "../functions/utilities";
import { MigrationFlags } from "../migrations/types";
import { pathOfCthulhuPreset } from "../presets";
import { runtimeConfig } from "../runtime";
import { ThemeV1 } from "../themes/types";
import { Mandatory } from "../types";
import {
  createSetting,
  createSettingArrayOfString,
  createSettingBoolean,
  createSettingString,
} from "./createSettings";
import { equipmentCategoriesValidator } from "./validators/equipmentCategoriesValidator";
import { personalDetailsValidator } from "./validators/personalDetailsValidator";
import { statsValidator } from "./validators/statsValidator";

export const settings = {
  /**
   * @deprecated
   */
  abilityCategories: createSettingString({
    key: "abilityCategories",
    name: "Ability categories",
    default: "Academic,Interpersonal,Technical",
  }),
  combatAbilities: createSettingArrayOfString({
    key: "combatAbilities",
    name: "Combat abilities",
    default: pathOfCthulhuPreset.combatAbilities,
  }),
  customThemePath: createSettingString({
    key: "customThemePath",
    name: "Custom theme path",
    default: c.defaultCustomThemePath,
    exportable: false as const,
  }),
  debugTranslations: createSettingBoolean({
    key: "debugTranslations",
    name: "Debug translations?",
    default: false,
    exportable: false,
  }),
  defaultThemeName: createSettingString({
    key: "defaultThemeName",
    name: "Default sheet theme",
    default: pathOfCthulhuPreset.defaultThemeName,
    choices: mapValues(
      (theme: ThemeV1) => theme.displayName,
      runtimeConfig.themes,
    ),
  }),
  generalAbilityCategories: createSettingArrayOfString({
    key: "generalAbilityCategories",
    name: "General ability categories",
    default: pathOfCthulhuPreset.generalAbilityCategories,
  }),
  genericOccupation: createSettingString({
    key: "genericOccupation",
    name: "Generic occupation",
    default: pathOfCthulhuPreset.genericOccupation,
  }),
  investigativeAbilityCategories: createSettingArrayOfString({
    key: "investigativeAbilityCategories",
    name: "Investigative ability categories",
    default: pathOfCthulhuPreset.investigativeAbilityCategories,
  }),
  longNotes: createSettingArrayOfString({
    key: "longNotes",
    name: "Long Notes",
    default: pathOfCthulhuPreset.longNotes,
  }),
  mwHiddenShortNotes: createSettingArrayOfString({
    key: "mwHiddenShortNotes",
    name: "Hidden short notes",
    default: [],
  }),
  mwUseAlternativeItemTypes: createSettingBoolean({
    key: "mwUseAlternativeItemTypes",
    name: "Use alternative item types",
    default: false,
  }),
  newNPCPacks: createSettingArrayOfString({
    key: "newNPCPacks",
    name: "Compendium packs for new NPCs",
    default: pathOfCthulhuPreset.newNPCPacks,
    onChange: (newPacks: string[]) => {
      Hooks.call(c.newNPCPacksUpdated, newPacks);
    },
  }),
  newPCPacks: createSettingArrayOfString({
    key: "newPCPacks",
    name: "Compendium packs for new PCs",
    default: pathOfCthulhuPreset.newPCPacks,
    onChange: (newPacks: string[]) => {
      Hooks.call(c.newPCPacksUpdated, newPacks);
    },
  }),
  occupationLabel: createSettingString({
    key: "occupationLabel",
    name: 'What do we call "Occupation"?',
    default: pathOfCthulhuPreset.occupationLabel,
  }),
  /**
   * @deprecated
   * Use personalDetails instead
   */
  shortNotes: createSettingArrayOfString({
    key: "shortNotes",
    name: "Short Notes",
    default: [""],
    exportable: false,
  }),
  showEmptyInvestigativeCategories: createSettingBoolean({
    key: "showEmptyInvestigativeCategories",
    name: "Show empty investigative categories?",
    default: true,
  }),
  systemMigrationVersion: createSettingString({
    key: "systemMigrationVersion",
    name: "System migration version",
    default: c.defaultMigratedSystemVersion,
    exportable: false,
  }),
  systemPreset: createSettingString({
    key: "systemPreset",
    name: "System preset",
    default: "pathOfCthulhuPreset",
  }),
  useBoost: createSettingBoolean({
    key: "useBoost",
    name: "Use Boost",
    default: pathOfCthulhuPreset.useBoost,
  }),
  useMwInjuryStatus: createSettingBoolean({
    key: "useMwInjuryStatus",
    name: "Use injury status",
    default: false,
  }),
  useMwStyleAbilities: createSettingBoolean({
    key: "useMwStyleAbilities",
    name: "Use Moribund World-style abilities",
    default: false,
  }),
  useNpcCombatBonuses: createSettingBoolean({
    key: "useNpcCombatBonuses",
    name: "Use NPC Combat Bonuses?",
    default: pathOfCthulhuPreset.useNpcCombatBonuses,
  }),
  useTurnPassingInitiative: createSettingBoolean({
    key: "useTurnPassingInitiative",
    name: "Use turn-passing initiative?",
    default: pathOfCthulhuPreset.useNpcCombatBonuses,
  }),

  // ///////////////////////////////////////////////////////////////////////////
  // object settings
  personalDetails: createSetting<Mandatory<PresetV1["personalDetails"]>>()(
    Object,
    personalDetailsValidator,
  )({
    key: "personalDetails",
    name: "Personal details",
    default: pathOfCthulhuPreset.personalDetails,
  }),

  pcStats: createSetting<PresetV1["pcStats"]>()(Object, statsValidator)({
    key: "pcStats",
    name: "What stats should PCs have?",
    default: pathOfCthulhuPreset.pcStats,
  }),

  npcStats: createSetting<PresetV1["npcStats"]>()(Object, statsValidator)({
    key: "npcStats",
    name: "What stats should NPCs have?",
    default: pathOfCthulhuPreset.npcStats,
  }),

  equipmentCategories: createSetting<
    Mandatory<PresetV1["equipmentCategories"]>
  >()(
    Object,
    equipmentCategoriesValidator,
  )({
    key: "equipmentCategories",
    name: "Equipment categories",
    default: pathOfCthulhuPreset.equipmentCategories,
  }),

  migrationFlags: createSetting<MigrationFlags>()(Object)({
    key: "migrationFlags",
    name: "Migration flags",
    default: {
      actor: {},
      item: {},
      compendium: {},
      journal: {},
      macro: {},
      scene: {},
      rollTable: {},
      playlist: {},
      world: {},
    },
    exportable: false,
  }),

  firstRun: createSettingBoolean({
    key: "firstRun",
    name: "First run?",
    default: true,
    exportable: false,
  }),

  journalMemories: createSetting<DocumentMemoryCollection>()(Object)({
    key: c.journalMemories,
    name: "Journal memories",
    default: {},
    exportable: false,
  }),
};

// -----------------------------------------------------------------------------

export const getDefaultGeneralAbilityCategory = () => {
  const cat = settings.generalAbilityCategories.get()[0];
  if (!cat) {
    throw new Error("No general ability categories found in system settings");
  }
  return cat;
};

export const getDefaultInvestigativeAbilityCategory = () => {
  const cat = settings.investigativeAbilityCategories.get()[0];
  if (!cat) {
    throw new Error(
      "No investigative ability categories found in system settings",
    );
  }
  return cat;
};

export type SettingsDict = {
  [Property in keyof typeof settings]: ReturnType<
    (typeof settings)[Property]["get"]
  >;
};

export const getSettingsDict = () =>
  mapValues((x) => x.get(), settings) as SettingsDict;

const valObj = Object.fromEntries(
  Object.entries(settings)
    .filter(([_, setting]) => !!setting.validator && setting.exportable)
    .map(([key, setting]) => [key, setting.validator?.optional()]),
);

export const superValidator = z.object(valObj as any).strict();
