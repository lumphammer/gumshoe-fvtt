import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { Fragment, useCallback, useContext } from "react";

import { InvestigatorItem } from "../../module/InvestigatorItem";
import { assertAbilityItem } from "../../v10Types";
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
        void ability.setRatingAndRefreshPool(1);
      } else {
        void ability.setRatingAndRefreshPool(0);
      }
    },
    [ability],
  );

  return (
    <Fragment key={ability.id}>
      <a
        onClick={() => {
          void ability.sheet?.render(true);
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
      {ability.system.hasSpecialities && ability.getSpecialitesCount() > 0 && (
        <div css={{ paddingLeft: "2em", gridColumn: "1/-1" }}>
          <SpecialityList ability={ability} />
        </div>
      )}
    </Fragment>
  );
};
