/** @jsx jsx */
import { jsx } from "@emotion/react";
import React, { Fragment, useCallback, useContext, useState } from "react";
import { GumshoeItem } from "../../module/GumshoeItem";
import { ActorSheetAppContext } from "../FoundryAppContext";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { TextArea } from "../inputs/TextArea";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Checkbox } from "../inputs/Checkbox";

type WeaponRowEditProps = {
  weapon: GumshoeItem,
};

export const WeaponRowEdit: React.FC<WeaponRowEditProps> = ({
  weapon,
}) => {
  const app = useContext(ActorSheetAppContext);
  const onDragStart = useCallback((e: React.DragEvent<HTMLAnchorElement>) => {
    if (app !== null) {
      (app as any)._onDragStart(e);
    }
  }, [app]);
  const [hover, setHover] = useState(false);
  const onMouseOver = useCallback(() => { setHover(true); }, []);
  const onMouseOut = useCallback(() => { setHover(false); }, []);

  const notes = useAsyncUpdate(weapon.getNotes(), weapon.setNotes);

  return (
    <Fragment>
      <a
        css={{ gridColumn: 1, overflow: "hidden", textOverflow: "ellipsis" }}
        className={hover ? "hover" : ""}
        onClick={() => weapon.sheet?.render(true)}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        data-item-id={weapon.id}
        onDragStart={onDragStart}
        draggable="true"
      >
        {weapon.name}
      </a>
      <div css={{ gridColumn: 2, display: "flex" }}>
        <AsyncNumberInput
          min={0}
          value={weapon.getDamage()}
          onChange={weapon.setDamage}
          noPlusMinus={true}
          css={{ width: "3em", paddingRight: "1.5em" }}
        />
        { weapon.getIsPointBlank() && (
          <AsyncNumberInput
            min={0}
            value={weapon.getPointBlankDamage()}
            onChange={weapon.setPointBlankDamage}
            noPlusMinus={true}
            css={{ width: "1.5em" }}
          />
        )}
        { weapon.getIsCloseRange() && "/" }
        { weapon.getIsCloseRange() && (
          <AsyncNumberInput
            min={0}
            value={weapon.getCloseRangeDamage()}
            onChange={weapon.setCloseRangeDamage}
            noPlusMinus={true}
            css={{ width: "1.5em" }}
          />
        )}
        { weapon.getIsNearRange() && "/" }
        { weapon.getIsNearRange() && (
          <AsyncNumberInput
            min={0}
            value={weapon.getNearRangeDamage()}
            onChange={weapon.setNearRangeDamage}
            noPlusMinus={true}
            css={{ width: "1.5em" }}
          />
        )}
        { weapon.getIsLongRange() && "/" }
        { weapon.getIsLongRange() && (
          <AsyncNumberInput
            min={0}
            value={weapon.getLongRangeDamage()}
            onChange={weapon.setLongRangeDamage}
            noPlusMinus={true}
            css={{ width: "1.5em" }}
          />
        )}
      </div>
      <div css={{ gridColumn: 3, display: "flex" }}>
        <Checkbox
          checked={weapon.getUsesAmmo()}
          onChange={weapon.setUsesAmmo}
        />
        {weapon.getUsesAmmo() && (
          <span css={{ display: "flex" }}>
            <AsyncNumberInput
              min={0}
              value={weapon.getAmmo()}
              onChange={weapon.setAmmo}
              noPlusMinus={true}
              css={{ width: "2em" }}
            />
            {"/"}
            <AsyncNumberInput
              min={0}
              value={weapon.getAmmoMax()}
              onChange={weapon.setAmmoMax}
              noPlusMinus={true}
              css={{ width: "2em" }}
            />
          </span>
        )}
      </div>
      <div
        css={{ gridColumn: "1 / -2", paddingLeft: "1em" }}
      >
        <TextArea value={notes.display} onChange={notes.onChange} />
      </div>
    </Fragment>
  );
};
