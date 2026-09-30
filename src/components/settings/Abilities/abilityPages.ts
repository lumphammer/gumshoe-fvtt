import type { SettingsPageDef } from "../SettingsMenu";
import {
  abilityOptions,
  generalAbilityCategories,
  investigativeAbilityCategories,
  npcAbilityPacks,
  pcAbilityPacks,
} from "./directions";

/**
 * The pages under the abilities settings menu, in menu order.
 */
export const abilityPages: SettingsPageDef[] = [
  {
    direction: investigativeAbilityCategories,
    label: "Investigative ability categories",
    description: "InvestigativeAbilityCategoriesDescription",
    summary: (s) => s.investigativeAbilityCategories.length,
  },
  {
    direction: generalAbilityCategories,
    label: "General ability categories",
    description: "GeneralAbilityCategoriesDescription",
    summary: (s) => s.generalAbilityCategories.length,
  },
  {
    direction: pcAbilityPacks,
    label: "PC Ability compendiums",
    description: "PcAbilityCompendiumsDescription",
    summary: (s) => s.newPCPacks.length,
  },
  {
    direction: npcAbilityPacks,
    label: "NPC Ability compendiums",
    description: "NpcAbilityCompendiumsDescription",
    summary: (s) => s.newNPCPacks.length,
  },
  {
    direction: abilityOptions,
    label: "Ability options",
    description: "AbilityOptionsDescription",
  },
];
