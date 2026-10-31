import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { Fragment, memo, useCallback, useContext } from "react";

import * as c from "../../constants";
import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { getRatingCapIn } from "../../module/actors/pcDerived";
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
  const settings = useSettings((s) => s);
  // a PC's adaptations and Sanity's cap
  const ratingCap = useActorSnapshot(ability.actor, (actor) =>
    actor?.type === c.pc ? getRatingCapIn(actor, row.name, settings) : null,
  );
  const { setRatingAndRefreshPool, setOccupational } =
    useSystemMethods(ability);
  const app = useContext(FoundryAppContext);
  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLAnchorElement>) => {
      if (app !== null) {
        (app as any)._onDragStart(e);
      }
    },
    [app],
  );
  const updateRating = useCallback(
    (rating: number) => {
      void setRatingAndRefreshPool(rating);
    },
    [setRatingAndRefreshPool],
  );

  return (
    <Fragment key={ability.id}>
      <a
        onClick={() => {
          const sheet = ability.sheet;
          assertApplicationV2(sheet);
          void sheet.render({ force: true });
        }}
        data-item-id={ability.id}
        onDragStart={onDragStart}
        draggable="true"
        css={{
          gridColumn: "ability",
          textAlign: "end",
          lineHeight: "1",
        }}
      >
        {row.name}
      </a>
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
