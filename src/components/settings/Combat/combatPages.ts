import type { SettingsPageDef } from "../SettingsMenu";
import { combatAbilities, combatOptions } from "./directions";

/**
 * The pages under the combat settings menu, in menu order.
 */
export const combatPages: SettingsPageDef[] = [
  {
    direction: combatAbilities,
    label: "Combat abilities",
    description: "CombatAbilitiesDescription",
    summary: (s) => s.combatAbilities.length,
  },
  {
    direction: combatOptions,
    label: "Combat options",
    description: "CombatOptionsDescription",
  },
];
