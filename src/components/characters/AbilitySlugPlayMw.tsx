import React, { Fragment, memo, useCallback, useState } from "react";

import { AbilityNameLink } from "./AbilityNameLink";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import { isGeneralAbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { Button } from "../inputs/Button";
import { css, cx } from "../../styled-system/css";
import { getTranslated } from "../../functions/getTranslated";

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
        <span aria-hidden="true">
          {row.pool}/{row.rating}
        </span>
        <span className={css({ srOnly: true })}>
          {getTranslated("PoolOfRating", {
            Pool: String(row.pool),
            Rating: String(row.rating),
          })}
        </span>
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
          aria-label={getTranslated("LowerBoonLevyOnAbility", {
            AbilityName: row.name,
          })}
        >
          <i
            className={cx("fa fa-minus", css({ fontSize: "x-small" }))}
            aria-hidden="true"
          />
        </Button>
        <Button
          className={css({ gridColumn: "2" })}
          onClick={onClickInc}
          disabled={boonLevy >= 2}
          aria-label={getTranslated("RaiseBoonLevyOnAbility", {
            AbilityName: row.name,
          })}
        >
          <i
            className={cx("fa fa-plus", css({ fontSize: "x-small" }))}
            aria-hidden="true"
          />
        </Button>
      </div>
      <div className={css({ gridColumn: "spend" })}>
        {row.isGeneral && (
          <Button
            className={css({ width: "4.1em" })}
            onClick={onTest}
            aria-label={getTranslated("TestAbilityPlus", {
              AbilityName: row.name,
              Spend: String(boonLevy),
            })}
          >
            <i className="fa fa-dice" title="Test" aria-hidden="true" />+
            {boonLevy}
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
