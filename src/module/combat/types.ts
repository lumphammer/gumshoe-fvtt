import { ClassicCombat, isClassicCombat } from "./classicCombat";
import { isTurnPassingCombat, TurnPassingCombat } from "./turnPassingCombat";

export function isValidCombat(
  combat: unknown,
): combat is ClassicCombat | TurnPassingCombat {
  // Check if the combat instance is valid
  return isClassicCombat(combat) || isTurnPassingCombat(combat);
}
