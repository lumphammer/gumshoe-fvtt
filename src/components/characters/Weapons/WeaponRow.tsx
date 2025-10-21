import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { generalAbility } from "../../../constants";
import { assertApplicationV2 } from "../../../functions/assertApplicationV2";
import { cleanAndEnrichHtml } from "../../../functions/textFunctions";
import { isAbilityItem } from "../../../module/items/exports";
import { InvestigatorItem } from "../../../module/items/InvestigatorItem";
import { WeaponItem } from "../../../module/items/weapon";
import { performAttack } from "../../equipment/performAttack";
import { Button } from "../../inputs/Button";
import { CheckButtons } from "../../inputs/CheckButtons";

type WeaponRowProps = {
  weapon: WeaponItem;
};

export const WeaponRow = ({ weapon }: WeaponRowProps) => {
  const app = useContext(FoundryAppContext);
  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLAnchorElement>) => {
      if (app !== null) {
        (app as any)._onDragStart(e);
      }
    },
    [app],
  );
  const [hover, setHover] = useState(false);
  const onMouseOver = useCallback(() => {
    setHover(true);
  }, []);
  const onMouseOut = useCallback(() => {
    setHover(false);
  }, []);
  const makeRangeOption = (
    isRange: boolean,
    rangeDamage: number,
    id: number,
    hover: string,
  ) => {
    const totalDamage = weapon.system.damage + rangeDamage;
    const label = isRange
      ? (totalDamage >= 0 ? "+" : "") + totalDamage.toString()
      : "-";
    return { label, value: id, enabled: isRange, rangeDamage, hover };
  };
  const rangeInfo = [
    makeRangeOption(
      weapon.system.isPointBlank,
      weapon.system.pointBlankDamage,
      0,
      "Point Blank",
    ),
    makeRangeOption(
      weapon.system.isCloseRange,
      weapon.system.closeRangeDamage,
      1,
      "Close Range",
    ),
    makeRangeOption(
      weapon.system.isNearRange,
      weapon.system.nearRangeDamage,
      2,
      "Near Range",
    ),
    makeRangeOption(
      weapon.system.isLongRange,
      weapon.system.longRangeDamage,
      3,
      "Long Range",
    ),
  ];
  const [rangeSelected, setRangeSelected] = useState(0);
  const ammoFail = weapon.system.usesAmmo && weapon.system.ammo.value <= 0;

  const abilityName = weapon.system.ability;
  const ability: InvestigatorItem | undefined = weapon.actor?.items.find(
    (item: InvestigatorItem) => {
      return item.type === generalAbility && item.name === abilityName;
    },
  );
  const pool = ability && isAbilityItem(ability) ? ability.system.pool : 0;
  const [spend, setSpend] = useState(0);
  const [bonusPool, setBonusPool] = useState(0);
  const onClickInc = useCallback(() => {
    setSpend((s) => s + 1);
  }, []);
  const onClickDec = useCallback(() => {
    setSpend((s) => s - 1);
  }, []);

  const basePerformAttack = useMemo(() => {
    return performAttack({
      spend,
      bonusPool,
      setSpend,
      setBonusPool,
      ability,
      weapon,
    });
  }, [ability, bonusPool, spend, weapon]);

  const rawHtml = weapon.system.notes.html;

  const [html, setHtml] = useState("");

  useEffect(() => {
    void cleanAndEnrichHtml(rawHtml).then(setHtml);
  }, [rawHtml]);

  const onAttack = () => {
    void basePerformAttack({
      rangeName: rangeInfo[rangeSelected].hover,
      rangeDamage: rangeInfo[rangeSelected].rangeDamage,
    });
  };

  const sheet = weapon.sheet;
  assertApplicationV2(sheet);

  return (
    <>
      <a
        css={{ gridColumn: 1, overflow: "hidden", textOverflow: "ellipsis" }}
        className={hover ? "hover" : ""}
        onClick={() => sheet.render({ force: true })}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        data-item-id={weapon.id}
        onDragStart={onDragStart}
        draggable="true"
      >
        {weapon.name}
      </a>
      {weapon.system.usesAmmo ? (
        <div css={{ gridColumn: 2 }}>
          <Button
            css={{ width: "1.5em", padding: "0" }}
            onClick={weapon.system.reload}
          >
            <i className="fa fa-redo fa-xs" />
          </Button>
          &nbsp;
          {weapon.system.ammo.value}/{weapon.system.ammo.max}
        </div>
      ) : (
        <div css={{ gridColumn: 2, textAlign: "center" }}>&mdash;</div>
      )}
      <div css={{ gridColumn: 3 }}>
        <CheckButtons
          onChange={setRangeSelected}
          selected={rangeSelected}
          options={rangeInfo}
          size={1}
        />
      </div>
      <div
        css={{
          gridColumn: 4,
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
          disabled={spend >= pool}
        >
          <i css={{ fontSize: "x-small" }} className="fa fa-plus" />
        </Button>
        <Button
          css={{ gridColumn: 3, width: "4.1em" }}
          onClick={onAttack}
          disabled={ammoFail}
        >
          <i className="fa fa-dice" title="Test" />+{spend}
        </Button>
      </div>
      <div
        css={{
          gridColumn: "1 / -1",
          paddingLeft: "1em",
          whiteSpace: "normal",
          maxHeight: "8em",
          overflow: "auto",
          marginBottom: "1em",
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
};
