import React, { Fragment, memo, useCallback } from "react";

import { AbilityNameLink } from "./AbilityNameLink";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useRatingCap } from "../../hooks/useRatingCaps";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import { getSpecialitiesCountOf } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { SpecialityList } from "../abilities/SpecialityList";
import { AsyncCheckbox } from "../inputs/AsyncCheckbox";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";

type AbilitySlugEditProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
  showOcc?: boolean;
};

export const AbilitySlugEdit = memo(function AbilitySlugEdit({
  ability,
  showOcc = true,
}: AbilitySlugEditProps) {
  const row = useItemSelector(ability, (snapshot: AbilitySnapshot) => ({
    name: snapshot.name,
    rating: snapshot.system.rating,
    max: snapshot.system.max,
    occupational: snapshot.system.occupational,
    hasSpecialities: snapshot.system.hasSpecialities,
    specialitiesCount: getSpecialitiesCountOf(snapshot.system),
  }));
  // a PC's adaptations and Sanity's cap
  const ratingCap = useRatingCap(ability).cap;
  const { setRatingAndRefreshPool, setOccupational } =
    useSystemMethods(ability);
  const updateRating = useCallback(
    (rating: number) => {
      void setRatingAndRefreshPool(rating);
    },
    [setRatingAndRefreshPool],
  );

  return (
    <Fragment key={ability.id}>
      <AbilityNameLink
        ability={ability}
        name={row.name}
        css={{ lineHeight: "1" }}
      />
      <div css={{ gridColumn: "rating", justifySelf: "center" }}>
        <AsyncNumberInput
          min={0}
          max={Math.min(row.max, ratingCap ?? Infinity)}
          value={row.rating}
          onChange={updateRating}
          smallButtons
        />
      </div>
      {showOcc && (
        <div css={{ gridColumn: "isocc", justifySelf: "center" }}>
          <AsyncCheckbox
            checked={row.occupational}
            onChange={setOccupational}
            title="Occupational Ability?"
          />
        </div>
      )}

      <AbilityBadges ability={ability} css={{ gridColumn: "1/-1" }} />
      {row.hasSpecialities && row.specialitiesCount > 0 && (
        <div css={{ paddingLeft: "2em", gridColumn: "1/-1" }}>
          <SpecialityList ability={ability} />
        </div>
      )}
    </Fragment>
  );
});
