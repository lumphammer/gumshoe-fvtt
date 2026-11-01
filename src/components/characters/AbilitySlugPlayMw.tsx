import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, {
  Fragment,
  memo,
  useCallback,
  useContext,
  useState,
} from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import { isGeneralAbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { Button } from "../inputs/Button";

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
  const app = useContext(FoundryAppContext);
  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLAnchorElement>) => {
      if (app !== null) {
        (app as any)._onDragStart(e);
      }
    },
    [app],
  );

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
          disabled={boonLevy <= -2}
        >
          <i css={{ fontSize: "x-small" }} className="fa fa-minus" />
        </Button>
        <Button
          css={{ gridColumn: "2" }}
          onClick={onClickInc}
          disabled={boonLevy >= 2}
        >
          <i css={{ fontSize: "x-small" }} className="fa fa-plus" />
        </Button>
      </div>
      <div css={{ gridColumn: "spend" }}>
        {row.isGeneral && (
          <Button css={{ width: "4.1em" }} onClick={onTest}>
            <i className="fa fa-dice" title="Test" />+{boonLevy}
          </Button>
        )}
      </div>
      {row.hasSpecialities && (
        <div css={{ paddingLeft: "1em", gridColumn: "ability", width: "2em" }}>
          {row.specialities.map((x, i) => (
            <div key={i}>{x.trim()}</div>
          ))}
        </div>
      )}
    </Fragment>
  );
});
