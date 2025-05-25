import { useCallback } from "react";

import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { assertAbilityItem } from "../../v10Types";
import { SpecListItem } from "./SpecListItem";

type SpecialityListProps = {
  ability: InvestigatorItem;
};

export const SpecialityList = ({ ability }: SpecialityListProps) => {
  assertAbilityItem(ability);
  const updateSpecialities = useCallback(
    (newVal: string, index: number) => {
      const newSpecs = [...ability.getSpecialities()];
      newSpecs[index] = newVal;
      void ability.setSpecialities(newSpecs);
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
      {ability.getSpecialities().map((spec, i) => (
        <SpecListItem
          key={i}
          value={spec}
          onChange={updateSpecialities}
          index={i}
          disabled={!ability.system.hasSpecialities}
        />
      ))}
      {ability.getSpecialitesCount() === 0 && (
        <i>Rating must be at least 1 to add specialities</i>
      )}
    </div>
  );
};
