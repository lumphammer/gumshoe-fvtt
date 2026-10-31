import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { Fragment, memo, useCallback, useContext } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";

type AbilitySlugPlayQuickShockInvestigativeProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
  disabled: boolean;
};

export const AbilitySlugPlayQuickShockInvestigative = memo(
  function AbilitySlugPlayQuickShockInvestigative({
    ability,
    disabled,
  }: AbilitySlugPlayQuickShockInvestigativeProps) {
    const row = useItemSelector(ability, (snapshot: AbilitySnapshot) => ({
      name: snapshot.name,
      hasSpecialities: snapshot.system.hasSpecialities,
      specialities: snapshot.system.specialities,
    }));
    const { push } = useSystemMethods(ability);
    const app = useContext(FoundryAppContext);
    const onDragStart = useCallback(
      (e: React.DragEvent<HTMLAnchorElement>) => {
        if (app !== null) {
          (app as any)._onDragStart(e);
        }
      },
      [app],
    );

    const handleClickPush = useCallback(() => {
      void push();
    }, [push]);

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
            lineHeight: 0.9,
            textAlign: "end",
          }}
        >
          {row.name}
        </a>
        <div css={{ gridColumn: "rating/-1", justifySelf: "right" }}>
          <Button
            css={{ width: "4.1em" }}
            onClick={handleClickPush}
            disabled={disabled}
          >
            <Translate>Push</Translate>
          </Button>
        </div>
        <AbilityBadges ability={ability} css={{ gridColumn: "1/-1" }} />
        {row.hasSpecialities && (
          <div css={{ paddingLeft: "1em", gridColumn: "1/-1" }}>
            {row.specialities.map((x, i) => (
              <div key={i}>{x.trim()}</div>
            ))}
          </div>
        )}
      </Fragment>
    );
  },
);
