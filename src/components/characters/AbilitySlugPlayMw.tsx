import React, { Fragment, memo, useCallback, useState } from "react";

import { AbilityNameLink } from "./AbilityNameLink";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import { isGeneralAbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { Button } from "../inputs/Button";
import { css, cx } from "../../styled-system/css";

type AbilitySlugPlayMwProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
};

export const AbilitySlugPlayMw = memo(function AbilitySlugPlayMw({
  ability,
}: AbilitySlugPlayMwProps) {
  const row = useItemSelector(ability, (snapshot: AbilitySnapshot) => ({
    name: snapshot.name,
    pool: snapshot.system.pool,
    rating: snapshot.system.rating,
    isGeneral: isGeneralAbilitySnapshot(snapshot),
    hasSpecialities: snapshot.system.hasSpecialities,
    specialities: snapshot.system.specialities,
  }));
  const { mwTestAbility } = useSystemMethods(ability);

  const [boonLevy, setBoonlevy] = useState(0);

  const onTest = useCallback(() => {
    void mwTestAbility(0, boonLevy);
    setBoonlevy(0);
  }, [mwTestAbility, boonLevy]);

  const onClickInc = useCallback(() => {
    setBoonlevy((s) => s + 1);
  }, []);

  const onClickDec = useCallback(() => {
    setBoonlevy((s) => s - 1);
  }, []);

  return (
    <Fragment key={ability.id}>
      <AbilityNameLink
        ability={ability}
        name={row.name}
        className={css({ lineHeight: 0.9 })}
      />
      <div className={css({ gridColumn: "rating", justifySelf: "right" })}>
        {row.pool}/{row.rating}
      </div>
      <div
        className={css({
          gridColumn: "set",
          display: "grid",
          gridTemplateColumns: "1.6em 1.6em",
        })}
      >
        <Button
          className={css({ gridColumn: "1" })}
          onClick={onClickDec}
          disabled={boonLevy <= -2}
        >
          <i className={cx("fa fa-minus", css({ fontSize: "x-small" }))} />
        </Button>
        <Button
          className={css({ gridColumn: "2" })}
          onClick={onClickInc}
          disabled={boonLevy >= 2}
        >
          <i className={cx("fa fa-plus", css({ fontSize: "x-small" }))} />
        </Button>
      </div>
      <div className={css({ gridColumn: "spend" })}>
        {row.isGeneral && (
          <Button className={css({ width: "4.1em" })} onClick={onTest}>
            <i className="fa fa-dice" title="Test" />+{boonLevy}
          </Button>
        )}
      </div>
      {row.hasSpecialities && (
        <div
          className={css({
            paddingLeft: "1em",
            gridColumn: "ability",
            width: "2em",
          })}
        >
          {row.specialities.map((x, i) => (
            <div key={i}>{x.trim()}</div>
          ))}
        </div>
      )}
    </Fragment>
  );
});
