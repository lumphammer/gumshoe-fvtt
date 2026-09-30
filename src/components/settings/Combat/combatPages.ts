import { combatAbilities, combatOptions } from "./directions";

/**
 * The pages under the combat settings menu, in menu order.
 */
export const combatPages = [
  { direction: combatAbilities, label: "Combat abilities" },
  { direction: combatOptions, label: "Combat options" },
];
