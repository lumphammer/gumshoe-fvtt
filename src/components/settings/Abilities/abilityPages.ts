import {
  combatAbilities,
  compendiumPacks,
  generalAbilityCategories,
  investigativeAbilityCategories,
  otherAbilityOptions,
} from "./directions";

/**
 * The pages under the abilities settings menu, in menu order.
 */
export const abilityPages = [
  { direction: compendiumPacks, label: "Compendium Packs" },
  {
    direction: investigativeAbilityCategories,
    label: "Investigative ability categories",
  },
  { direction: generalAbilityCategories, label: "General ability categories" },
  { direction: combatAbilities, label: "Combat abilities" },
  { direction: otherAbilityOptions, label: "Other options" },
];
