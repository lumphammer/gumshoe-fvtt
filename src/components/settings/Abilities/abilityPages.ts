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
export const abilityPages = [
  {
    direction: investigativeAbilityCategories,
    label: "Investigative ability categories",
  },
  { direction: generalAbilityCategories, label: "General ability categories" },
  { direction: pcAbilityPacks, label: "PC Ability compendiums" },
  { direction: npcAbilityPacks, label: "NPC Ability compendiums" },
  { direction: abilityOptions, label: "Ability options" },
];
