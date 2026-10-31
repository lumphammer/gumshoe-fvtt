import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { Fragment, memo, useCallback, useContext } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import { getSpecialitiesCountOf } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { SpecialityList } from "../abilities/SpecialityList";
import { Toggle } from "../inputs/Toggle";

type AbilitySlugEditQuickShockInvestigativeProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
};

export const AbilitySlugEditQuickShockInvestigative = memo(
  function AbilitySlugEditQuickShockInvestigative({
    ability,
  }: AbilitySlugEditQuickShockInvestigativeProps) {
    const row = useItemSelector(ability, (snapshot: AbilitySnapshot) => ({
      name: snapshot.name,
      rating: snapshot.system.rating,
      hasSpecialities: snapshot.system.hasSpecialities,
      specialitiesCount: getSpecialitiesCountOf(snapshot.system),
    }));
    const { setRatingAndRefreshPool } = useSystemMethods(ability);
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
        void setRatingAndRefreshPool(checked ? 1 : 0);
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
            marginBottom: "0.5em",
            textAlign: "end",
          }}
        >
          {row.name}
        </a>
        <div css={{ gridColumn: "rating", justifySelf: "center" }}>
          <Toggle checked={row.rating > 0} onChange={handleToggle} />
        </div>
        <AbilityBadges ability={ability} css={{ gridColumn: "1/-1" }} />
        {row.hasSpecialities && row.specialitiesCount > 0 && (
          <div css={{ paddingLeft: "2em", gridColumn: "1/-1" }}>
            <SpecialityList ability={ability} />
          </div>
        )}
      </Fragment>
    );
  },
);
