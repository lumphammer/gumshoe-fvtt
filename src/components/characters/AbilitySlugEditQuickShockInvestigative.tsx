import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { Fragment, useCallback, useContext } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { assertAbilityItem } from "../../module/items/exports";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { SpecialityList } from "../abilities/SpecialityList";
import { Toggle } from "../inputs/Toggle";

type AbilitySlugEditQuickShockInvestigativeProps = {
  ability: InvestigatorItem;
};

export const AbilitySlugEditQuickShockInvestigative = ({
  ability,
}: AbilitySlugEditQuickShockInvestigativeProps) => {
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

  const handleToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        void ability.system.setRatingAndRefreshPool(1);
      } else {
        void ability.system.setRatingAndRefreshPool(0);
      }
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
        css={{ gridColumn: "ability", marginBottom: "0.5em", textAlign: "end" }}
      >
        {ability.name}
      </a>
      <div css={{ gridColumn: "rating", justifySelf: "center" }}>
        <Toggle checked={ability.system.rating > 0} onChange={handleToggle} />
      </div>
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
