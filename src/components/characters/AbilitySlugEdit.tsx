import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { Fragment, useCallback, useContext } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { assertAbilityItem } from "../../module/items/exports";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { SpecialityList } from "../abilities/SpecialityList";
import { AsyncCheckbox } from "../inputs/AsyncCheckbox";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";

type AbilitySlugEditProps = {
  ability: InvestigatorItem;
  showOcc?: boolean;
};

export const AbilitySlugEdit = ({
  ability,
  showOcc = true,
}: AbilitySlugEditProps) => {
  assertAbilityItem(ability);
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
      void ability.system.setRatingAndRefreshPool(rating);
    },
    [ability],
  );

  const sheet = ability.sheet;
  assertApplicationV2(sheet);

  return (
    <Fragment key={ability.id}>
      <a
        onClick={() => {
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
        {ability.name}
      </a>
      <div css={{ gridColumn: "rating", justifySelf: "center" }}>
        <AsyncNumberInput
          min={0}
          max={ability.system.max}
          value={ability.system.rating}
          onChange={updateRating}
          smallButtons
        />
      </div>
      {showOcc && (
        <div css={{ gridColumn: "isocc", justifySelf: "center" }}>
          <AsyncCheckbox
            checked={ability.system.occupational}
            onChange={ability.system.setOccupational}
            title="Occupational Ability?"
          />
        </div>
      )}

      <AbilityBadges ability={ability} css={{ gridColumn: "1/-1" }} />
      {ability.system.hasSpecialities &&
        ability.system.getSpecialitesCount() > 0 && (
          <div css={{ paddingLeft: "2em", gridColumn: "1/-1" }}>
            <SpecialityList ability={ability} />
          </div>
        )}
    </Fragment>
  );
};
