import { memo } from "react";

import { useItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { badge } from "../../styled-system/recipes";

/** The specialities worth showing: not blank */
const nonBlank = (specialities: readonly string[]) =>
  specialities.map((speciality) => speciality.trim()).filter(Boolean);

/**
 * Specialities as tags (blank ones left out), with no box of their own: the
 * caller lays them out, with whatever else is in the line
 */
export const SpecialityTags = ({
  specialities,
  size,
}: {
  specialities: readonly string[];
  /** `sm` in a dense list (an ability's row) */
  size?: "sm" | "md";
}) =>
  nonBlank(specialities).map((speciality, i) => (
    <span key={i} className={badge({ kind: "tag", size })}>
      {speciality}
    </span>
  ));

/** An ability's specialities, small, as tags (in `AbilityRowTags`) */
export const AbilitySpecialities = memo(function AbilitySpecialities({
  ability,
}: {
  /** The live ability: read through a snapshot */
  ability: AbilityItem;
}) {
  const specialities = useItemSelector(ability, (snapshot: AbilitySnapshot) =>
    snapshot.system.hasSpecialities ? snapshot.system.specialities : null,
  );
  if (specialities === null) return null;
  return <SpecialityTags specialities={specialities} size="sm" />;
});
