import {
  generalAbilityCategories,
  investigativeAbilityCategories,
  otherAbilityOptions,
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
  { direction: otherAbilityOptions, label: "Other options" },
];
