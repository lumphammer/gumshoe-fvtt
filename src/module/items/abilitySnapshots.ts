import * as c from "../../constants";
import type { ItemSnapshot } from "../snapshots/documentStores";
import type { GeneralAbilitySystemData } from "./generalAbility";
import type { InvestigativeAbilitySystemData } from "./investigativeAbility";
import { getSpecialitiesCount, resizeSpecialities } from "./resizeSpecialities";

// Snapshots of abilities (see docs/immutable-data.md), and what's worked out
// from them: the pure counterparts of `AbilityModel`'s getters.

export type GeneralAbilitySnapshot = ItemSnapshot<GeneralAbilitySystemData>;
export type InvestigativeAbilitySnapshot =
  ItemSnapshot<InvestigativeAbilitySystemData>;
export type AbilitySnapshot =
  | GeneralAbilitySnapshot
  | InvestigativeAbilitySnapshot;

export function isGeneralAbilitySnapshot(
  ability: AbilitySnapshot,
): ability is GeneralAbilitySnapshot {
  return ability.type === c.generalAbility;
}

export function isInvestigativeAbilitySnapshot(
  ability: AbilitySnapshot,
): ability is InvestigativeAbilitySnapshot {
  return ability.type === c.investigativeAbility;
}

type Specialities = Pick<
  AbilitySnapshot["system"],
  "specialities" | "hasSpecialities" | "rating" | "specialitiesMode"
>;

/** The ability's specialities, as many as its rating allows */
export function getSpecialitiesOf(system: Specialities): string[] {
  return resizeSpecialities(system.specialities, system);
}

/** How many specialities the ability has room for */
export function getSpecialitiesCountOf(system: Specialities): number {
  return getSpecialitiesCount(system);
}

/** The unlocks the ability's rating has reached (with something to say) */
export function getActiveUnlocksOf(
  system: Pick<AbilitySnapshot["system"], "unlocks" | "rating">,
) {
  return system.unlocks.filter(
    ({ rating, description }) => system.rating >= rating && description !== "",
  );
}

/** The situational modifiers with a situation to show */
export function getVisibleSituationalModifiersOf(
  system: Pick<AbilitySnapshot["system"], "situationalModifiers">,
) {
  return system.situationalModifiers.filter(
    ({ situation }) => situation !== "",
  );
}

/** Whether pressing the ability pushes it, rather than spending or testing */
export function isPushOrQuickShock(ability: AbilitySnapshot): boolean {
  return isGeneralAbilitySnapshot(ability)
    ? ability.system.isPushPool
    : ability.system.isQuickShock;
}
