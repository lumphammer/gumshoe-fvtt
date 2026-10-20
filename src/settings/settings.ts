import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";
import { z } from "zod";

import type { DocumentMemoryCollection } from "../components/journalEditorSheet/documentMemory";
import * as c from "../constants";
import { mapValues } from "../functions/utilities";
import type { MigrationFlags } from "../migrations/types";
import { defaultSettings } from "../presets";
import { runtimeConfig } from "../runtime";
import type { ThemeV1 } from "../themes/types";
import type { Mandatory } from "../types";
import {
  createSetting,
  createSettingArrayOfString,
  createSettingBoolean,
  createSettingString,
} from "./createSettings";
import { cardCategoriesValidator } from "./validators/cardCategoriesValidator";
import { equipmentCategoriesValidator } from "./validators/equipmentCategoriesValidator";
import { personalDetailsValidator } from "./validators/personalDetailsValidator";
import {
  stabilityStatesValidator,
  traumaTypesValidator,
} from "./validators/stabilityValidators";
import { statsValidator } from "./validators/statsValidator";

export const settings = {
  combatAbilities: createSettingArrayOfString({
    key: "combatAbilities",
    name: "Combat abilities",
    default: defaultSettings.combatAbilities,
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
    default: defaultSettings.defaultThemeName,
    choices: mapValues(
      (theme: ThemeV1) => theme.displayName,
      runtimeConfig.themes,
    ),
  }),
  generalAbilityCategories: createSettingArrayOfString({
    key: "generalAbilityCategories",
    name: "General ability categories",
    default: defaultSettings.generalAbilityCategories,
  }),
  genericOccupation: createSettingString({
    key: "genericOccupation",
    name: "Generic occupation",
    default: defaultSettings.genericOccupation,
  }),
  investigativeAbilityCategories: createSettingArrayOfString({
    key: "investigativeAbilityCategories",
    name: "Investigative ability categories",
    default: defaultSettings.investigativeAbilityCategories,
  }),
  longNotes: createSettingArrayOfString({
    key: "longNotes",
    name: "Long Notes",
    default: defaultSettings.longNotes,
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
    default: defaultSettings.newNPCPacks,
    onChange: (newPacks: string[]) => {
      Hooks.call(c.newNPCPacksUpdated, newPacks);
    },
  }),
  newPCPacks: createSettingArrayOfString({
    key: "newPCPacks",
    name: "Compendium packs for new PCs",
    default: defaultSettings.newPCPacks,
    onChange: (newPacks: string[]) => {
      Hooks.call(c.newPCPacksUpdated, newPacks);
    },
  }),
  occupationLabel: createSettingString({
    key: "occupationLabel",
    name: 'What do we call "Occupation"?',
    default: defaultSettings.occupationLabel,
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
    default: defaultSettings.showEmptyInvestigativeCategories,
  }),
  systemMigrationVersion: createSettingString({
    key: "systemMigrationVersion",
    name: "System migration version",
    default: c.defaultMigratedSystemVersion,
    exportable: false,
    managedBySettingsForm: false,
  }),
  systemPreset: createSettingString({
    key: "systemPreset",
    name: "System preset",
    default: "pathOfCthulhuPreset",
  }),
  useBoost: createSettingBoolean({
    key: "useBoost",
    name: "Use Boost",
    default: defaultSettings.useBoost,
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
    default: defaultSettings.useNpcCombatBonuses,
  }),
  useTurnPassingInitiative: createSettingBoolean({
    key: "useTurnPassingInitiative",
    name: "Use turn-passing initiative?",
    default: defaultSettings.useTurnPassingInitiative,
  }),
  useDamageApplication: createSettingBoolean({
    key: "useDamageApplication",
    name: "Use damage application?",
    default: defaultSettings.useDamageApplication,
  }),
  useGunfireOnHumans: createSettingBoolean({
    key: "useGunfireOnHumans",
    name: "Use gunfire on humans?",
    default: defaultSettings.useGunfireOnHumans,
  }),
  useCriticalHits: createSettingBoolean({
    key: "useCriticalHits",
    name: "Use critical hits?",
    default: defaultSettings.useCriticalHits,
  }),
  useLethalityAndAutofire: createSettingBoolean({
    key: "useLethalityAndAutofire",
    name: "Use Lethality and autofire?",
    default: defaultSettings.useLethalityAndAutofire,
  }),
  useShotDryAndJams: createSettingBoolean({
    key: "useShotDryAndJams",
    name: "Use Shot Dry and jams?",
    default: defaultSettings.useShotDryAndJams,
  }),
  useWalkingFire: createSettingBoolean({
    key: "useWalkingFire",
    name: "Use walking fire?",
    default: defaultSettings.useWalkingFire,
  }),
  useWoundStatusEffects: createSettingBoolean({
    key: "useWoundStatusEffects",
    name: "Apply wound status effects?",
    default: defaultSettings.useWoundStatusEffects,
  }),
  walkingFireSpendAbilities: createSettingArrayOfString({
    key: "walkingFireSpendAbilities",
    name: "Walking fire spend abilities",
    default: defaultSettings.walkingFireSpendAbilities,
  }),
  fullAutoSpendAbilities: createSettingArrayOfString({
    key: "fullAutoSpendAbilities",
    name: "Full-auto spend abilities",
    default: defaultSettings.fullAutoSpendAbilities,
  }),

  // ///////////////////////////////////////////////////////////////////////////
  // object settings
  personalDetails: createSetting<Mandatory<PresetV1["personalDetails"]>>()(
    Object,
    personalDetailsValidator,
  )({
    key: "personalDetails",
    name: "Personal details",
    default: defaultSettings.personalDetails,
  }),

  pcStats: createSetting<PresetV1["pcStats"]>()(Object, statsValidator)({
    key: "pcStats",
    name: "What stats should PCs have?",
    default: defaultSettings.pcStats,
  }),

  npcStats: createSetting<PresetV1["npcStats"]>()(Object, statsValidator)({
    key: "npcStats",
    name: "What stats should NPCs have?",
    default: defaultSettings.npcStats,
  }),

  equipmentCategories: createSetting<
    Mandatory<PresetV1["equipmentCategories"]>
  >()(
    Object,
    equipmentCategoriesValidator,
  )({
    key: "equipmentCategories",
    name: "Equipment categories",
    default: defaultSettings.equipmentCategories,
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
    managedBySettingsForm: false,
  }),

  /**
   * How many times a migration run has failed since the last successful one.
   * Once this hits `maximumAutomaticMigrationAttempts` we stop retrying on
   * startup and wait for the GM to ask for a retry from the settings dialog.
   *
   * Note this counts runs, not individual migrations: while it is exhausted,
   * migrations added by a later system version also wait for that manual
   * retry, which is deliberate - replaying a newer migration on top of a world
   * an older one failed to migrate is not safe.
   */
  migrationAttempts: createSetting<number>()(Number)({
    key: "migrationAttempts",
    name: "Migration attempts",
    default: 0,
    exportable: false,
    managedBySettingsForm: false,
  }),

  /** The error from the most recent failed migration run, for the GM to see. */
  migrationLastError: createSettingString({
    key: "migrationLastError",
    name: "Last migration error",
    default: "",
    exportable: false,
    managedBySettingsForm: false,
  }),

  firstRun: createSettingBoolean({
    key: "firstRun",
    name: "First run?",
    default: true,
    exportable: false,
    managedBySettingsForm: false,
  }),

  /**
   * Whether we've asked the GM of a Trail of Cthulhu world from before the
   * preset had Stability and Sanity rules whether to turn them on.
   */
  offeredTrailOfCthulhuRules: createSettingBoolean({
    key: "offeredTrailOfCthulhuRules",
    name: "Offered Trail of Cthulhu rules?",
    default: false,
    exportable: false,
    managedBySettingsForm: false,
  }),

  journalMemories: createSetting<DocumentMemoryCollection>()(Object)({
    key: c.journalMemories,
    name: "Journal memories",
    default: {},
    exportable: false,
    managedBySettingsForm: false,
  }),

  useStabilityRules: createSettingBoolean({
    key: "useStabilityRules",
    name: "Use Stability rules?",
    default: defaultSettings.useStabilityRules,
  }),
  stabilityAbility: createSettingString({
    key: "stabilityAbility",
    name: "Name of Stability ability",
    default: defaultSettings.stabilityAbility,
  }),
  useSanityRules: createSettingBoolean({
    key: "useSanityRules",
    name: "Use Sanity rules?",
    default: defaultSettings.useSanityRules,
  }),
  sanityAbility: createSettingString({
    key: "sanityAbility",
    name: "Name of Sanity ability",
    default: defaultSettings.sanityAbility,
  }),
  sanityCapAbility: createSettingString({
    key: "sanityCapAbility",
    name: "Sanity rating capped by",
    default: defaultSettings.sanityCapAbility,
  }),
  sanityCapBase: createSetting<number>()(Number, z.number())({
    key: "sanityCapBase",
    name: "Sanity cap before that",
    default: defaultSettings.sanityCapBase,
  }),
  useStabilityStates: createSettingBoolean({
    key: "useStabilityStates",
    name: "Use Stability states?",
    default: defaultSettings.useStabilityStates,
  }),
  stabilityStates: createSetting<Mandatory<PresetV1["stabilityStates"]>>()(
    Object,
    stabilityStatesValidator,
  )({
    key: "stabilityStates",
    name: "Stability states",
    default: defaultSettings.stabilityStates,
  }),
  useBonds: createSettingBoolean({
    key: "useBonds",
    name: "Use Bonds?",
    default: defaultSettings.useBonds,
  }),
  bondRebuildSpendCategory: createSettingString({
    key: "bondRebuildSpendCategory",
    name: "Category spent when rebuilding Bonds",
    default: defaultSettings.bondRebuildSpendCategory,
  }),
  useTrauma: createSettingBoolean({
    key: "useTrauma",
    name: "Use trauma?",
    default: defaultSettings.useTrauma,
  }),
  traumaTypes: createSetting<Mandatory<PresetV1["traumaTypes"]>>()(
    Array,
    traumaTypesValidator,
  )({
    key: "traumaTypes",
    name: "Trauma types",
    default: defaultSettings.traumaTypes,
  }),

  useCards: createSettingBoolean({
    key: "useCards",
    name: "Use cards?",
    default: false,
  }),

  cardCategories: createSetting<Mandatory<PresetV1["cardCategories"]>>()(
    Object,
    cardCategoriesValidator,
  )({
    key: "cardCategories",
    name: "What stats should PCs have?",
    default: defaultSettings.cardCategories,
  }),

  notifyItemAddedToActor: createSettingBoolean({
    key: "notifyItemAddedToActor",
    name: "Notify when an item is added to an actor",
    default: false,
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
