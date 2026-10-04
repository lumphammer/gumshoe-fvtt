import type { SettingsPageDef } from "../SettingsMenu";
import {
  combatAbilities,
  combatOptions,
  fullAutoSpendAbilities,
  walkingFireSpendAbilities,
} from "./directions";

/**
 * The pages under the combat settings menu, in menu order.
 */
export const combatPages: SettingsPageDef[] = [
  {
    direction: combatOptions,
    label: "Combat options",
    description: "CombatOptionsDescription",
  },
  {
    direction: combatAbilities,
    label: "Combat abilities",
    description: "CombatAbilitiesDescription",
    summary: (s) => s.combatAbilities.length,
  },
  {
    direction: fullAutoSpendAbilities,
    label: "Full-auto spend abilities",
    description: "FullAutoSpendAbilitiesDescription",
    summary: (s) => s.fullAutoSpendAbilities.length,
  },
  {
    direction: walkingFireSpendAbilities,
    label: "Walking fire spend abilities",
    description: "WalkingFireSpendAbilitiesDescription",
    summary: (s) => s.walkingFireSpendAbilities.length,
  },
];
