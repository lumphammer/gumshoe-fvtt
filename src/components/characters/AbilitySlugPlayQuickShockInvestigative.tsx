import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { Fragment, useCallback, useContext } from "react";

import { InvestigatorItem } from "../../module/InvestigatorItem";
import { assertAbilityItem } from "../../v10Types";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";

type AbilitySlugPlayQuickShockInvestigativeProps = {
  ability: InvestigatorItem;
  disabled: boolean;
};

export const AbilitySlugPlayQuickShockInvestigative = ({
  ability,
  disabled,
}: AbilitySlugPlayQuickShockInvestigativeProps) => {
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

  const handleClickPush = useCallback(() => {
    void ability.push();
  }, [ability]);

  return (
    <Fragment key={ability.id}>
      <a
        onClick={() => {
          void ability.sheet?.render(true);
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
        {ability.name}
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
      {ability.system.hasSpecialities && (
        <div css={{ paddingLeft: "1em", gridColumn: "1/-1" }}>
          {(ability.system.specialities || []).map((x: string, i: number) => (
            <div key={i}>{x.trim()}</div>
          ))}
        </div>
      )}
    </Fragment>
  );
};
