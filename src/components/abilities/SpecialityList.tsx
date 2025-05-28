import { useCallback } from "react";

import { assertAbilityItem } from "../../module/items/exports";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { SpecListItem } from "./SpecListItem";

type SpecialityListProps = {
  ability: InvestigatorItem;
};

export const SpecialityList = ({ ability }: SpecialityListProps) => {
  assertAbilityItem(ability);
  const updateSpecialities = useCallback(
    (newVal: string, index: number) => {
      const newSpecs = [...ability.system.getSpecialities()];
      newSpecs[index] = newVal;
      void ability.system.setSpecialities(newSpecs);
    },
    [ability],
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
      {ability.system.getSpecialities().map((spec, i) => (
        <SpecListItem
          key={i}
          value={spec}
          onChange={updateSpecialities}
          index={i}
          disabled={!ability.system.hasSpecialities}
        />
      ))}
      {ability.system.getSpecialitesCount() === 0 && (
        <i>Rating must be at least 1 to add specialities</i>
      )}
    </div>
  );
};
