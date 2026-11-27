import { memo } from "react";

import { useItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { css, cx } from "../../styled-system/css";
import { badge } from "../../styled-system/recipes";

/** The specialities worth showing: not blank */
const nonBlank = (specialities: readonly string[]) =>
  specialities.map((speciality) => speciality.trim()).filter(Boolean);

/** Specialities as tags, in a row which wraps (blank ones left out) */
export const SpecialityTags = ({
  specialities,
  className,
}: {
  specialities: readonly string[];
  className?: string;
}) => (
  <div
    className={cx(
      css({ display: "flex", flexWrap: "wrap", gap: "0.25em" }),
      className,
    )}
  >
    {nonBlank(specialities).map((speciality, i) => (
      <span key={i} className={badge({ kind: "tag" })}>
        {speciality}
      </span>
    ))}
  </div>
);

/** An ability's specialities, under its name on a character sheet */
export const AbilitySpecialities = memo(function AbilitySpecialities({
  ability,
}: {
  /** The live ability: read through a snapshot */
  ability: AbilityItem;
}) {
  const specialities = useItemSelector(ability, (snapshot: AbilitySnapshot) =>
    snapshot.system.hasSpecialities ? snapshot.system.specialities : null,
  );
  // none to show: no row, so no gap for it
  if (specialities === null || nonBlank(specialities).length === 0) {
    return null;
  }
  return (
    <SpecialityTags
      specialities={specialities}
      className={css({ gridColumn: "1/-1", paddingLeft: "1em" })}
    />
  );
});
