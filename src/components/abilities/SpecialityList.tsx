import { memo, useCallback } from "react";

import { useItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import {
  getSpecialitiesCountOf,
  getSpecialitiesOf,
} from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { SpecListItem } from "./SpecListItem";

type SpecialityListProps = {
  /**
   * The live ability: the list reads it through a snapshot (it's also on
   * character sheets' ability rows)
   */
  ability: AbilityItem;
};

export const SpecialityList = memo(function SpecialityList({
  ability: item,
}: SpecialityListProps) {
  const { specialities, count, hasSpecialities } = useItemSelector(
    item,
    ({ system }: AbilitySnapshot) => ({
      specialities: getSpecialitiesOf(system),
      count: getSpecialitiesCountOf(system),
      hasSpecialities: system.hasSpecialities,
    }),
  );
  const updateSpecialities = useCallback(
    (newVal: string, index: number) => {
      // from the live item, which has any change saved since this rendered
      const newSpecs = [...item.system.getSpecialities()];
      newSpecs[index] = newVal;
      void item.system.setSpecialities(newSpecs);
    },
    [item],
  );

  return (
    <div
      css={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(6em, 1fr))",
        gridAutoColumns: "minMax(6em, 1fr)",
        gridAutoRows: "auto",
        gap: "0.5em",
        flexWrap: "wrap",
      }}
    >
      {specialities.map((spec, i) => (
        <SpecListItem
          key={i}
          value={spec}
          onChange={updateSpecialities}
          index={i}
          disabled={!hasSpecialities}
        />
      ))}
      {count === 0 && <i>Rating must be at least 1 to add specialities</i>}
    </div>
  );
});
