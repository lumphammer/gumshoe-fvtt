import React, { Fragment, memo, useCallback, useState } from "react";

import { AbilityNameLink } from "./AbilityNameLink";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import { isGeneralAbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { Button } from "../inputs/Button";

type AbilitySlugPlayNormalProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
};

export const AbilitySlugPlayNormal = memo(function AbilitySlugPlayNormal({
  ability,
}: AbilitySlugPlayNormalProps) {
  "use memo";

  const row = useItemSelector(ability, (snapshot: AbilitySnapshot) => ({
    name: snapshot.name,
    pool: snapshot.system.pool,
    rating: snapshot.system.rating,
    isGeneral: isGeneralAbilitySnapshot(snapshot),
    canBeInvestigative:
      isGeneralAbilitySnapshot(snapshot) && snapshot.system.canBeInvestigative,
    hasSpecialities: snapshot.system.hasSpecialities,
    specialities: snapshot.system.specialities,
  }));
  const { testAbility, confirmSpendAbility } = useSystemMethods(ability);

  const [spend, setSpend] = useState(0);

  const onTest = useCallback(() => {
    void testAbility(spend);
    setSpend(0);
  }, [testAbility, spend]);

  const onSpend = useCallback(() => {
    void confirmSpendAbility(spend);
    setSpend(0);
  }, [confirmSpendAbility, spend]);

  const onClickInc = useCallback(() => {
    setSpend((s) => s + 1);
  }, []);

  const onClickDec = useCallback(() => {
    setSpend((s) => s - 1);
  }, []);

  return (
    <Fragment key={ability.id}>
      <AbilityNameLink
        ability={ability}
        name={row.name}
        css={{ lineHeight: 0.9 }}
      />
      <div css={{ gridColumn: "rating", justifySelf: "right" }}>
        {row.pool}/{row.rating}
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
          disabled={spend >= row.pool}
        >
          <i css={{ fontSize: "x-small" }} className="fa fa-plus" />
        </Button>
      </div>
      <div css={{ gridColumn: "spend" }}>
        {!row.isGeneral && (
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
        {row.isGeneral && (
          <Button css={{ width: "4.1em" }} onClick={onTest}>
            <i className="fa fa-dice" title="Test" />+{spend}
          </Button>
        )}
        {row.canBeInvestigative && (
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
      {row.hasSpecialities && (
        <div
          css={{ paddingLeft: "1em", gridColumn: "1/-1", textAlign: "right" }}
        >
          {row.specialities.map((x, i) => (
            <span key={i}>
              {x.trim()}
              {i < row.specialities.length - 1 && ", "}
            </span>
          ))}
        </div>
      )}
    </Fragment>
  );
});
