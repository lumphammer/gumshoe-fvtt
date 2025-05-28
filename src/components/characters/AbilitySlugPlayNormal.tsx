import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { Fragment, useCallback, useContext, useState } from "react";

import { assertAbilityItem } from "../../module/items/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import { isInvestigativeAbilityItem } from "../../module/items/investigativeAbility";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { Button } from "../inputs/Button";

type AbilitySlugPlayNormalProps = {
  ability: InvestigatorItem;
};

export const AbilitySlugPlayNormal = ({
  ability,
}: AbilitySlugPlayNormalProps) => {
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

  const [spend, setSpend] = useState(0);

  const onTest = useCallback(() => {
    void ability.system.testAbility(spend);
    setSpend(0);
  }, [ability, spend]);

  const onSpend = useCallback(() => {
    void ability.system.spendAbility(spend);
    setSpend(0);
  }, [ability, spend]);

  const onClickInc = useCallback(() => {
    setSpend((s) => s + 1);
  }, []);

  const onClickDec = useCallback(() => {
    setSpend((s) => s - 1);
  }, []);

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
      <div css={{ gridColumn: "rating", justifySelf: "right" }}>
        {ability.system.pool}/{ability.system.rating}
      </div>
      <div
        css={{
          gridColumn: "set",
          display: "grid",
          gridTemplateColumns: "1.6em 1.6em",
        }}
      >
        <Button
          css={{ gridColumn: "1" }}
          onClick={onClickDec}
          disabled={spend <= 0}
        >
          <i css={{ fontSize: "x-small" }} className="fa fa-minus" />
        </Button>
        <Button
          css={{ gridColumn: "2" }}
          onClick={onClickInc}
          disabled={spend >= ability.system.pool}
        >
          <i css={{ fontSize: "x-small" }} className="fa fa-plus" />
        </Button>
      </div>
      <div css={{ gridColumn: "spend" }}>
        {isInvestigativeAbilityItem(ability) && (
          <Button
            disabled={spend === 0}
            onClick={onSpend}
            style={{
              whiteSpace: "nowrap",
            }}
          >
            <i className="fa fa-search" title="Spend" />
            {spend}
          </Button>
        )}
        {isGeneralAbilityItem(ability) && (
          <Button css={{ width: "4.1em" }} onClick={onTest}>
            <i className="fa fa-dice" title="Test" />+{spend}
          </Button>
        )}
        {isGeneralAbilityItem(ability) && ability.system.canBeInvestigative && (
          <Button
            css={{ width: "2em" }}
            disabled={spend === 0}
            onClick={onSpend}
          >
            <i className="fa fa-search" title="Spend" />
          </Button>
        )}
      </div>
      <AbilityBadges ability={ability} css={{ gridColumn: "1/-1" }} />
      {ability.system.hasSpecialities && (
        <div
          css={{ paddingLeft: "1em", gridColumn: "1/-1", textAlign: "right" }}
        >
          {(ability.system.specialities || []).map((x: string, i: number) => (
            <span key={i}>
              {x.trim()}
              {i < ability.system.specialities.length - 1 && ", "}
            </span>
          ))}
        </div>
      )}
    </Fragment>
  );
};
