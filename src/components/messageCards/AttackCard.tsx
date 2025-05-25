import React, { useCallback } from "react";

import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { Translate } from "../Translate";
import { DiceTerms } from "./DiceTerms";

interface AttackCardProps {
  msg: ChatMessage;
  weapon: InvestigatorItem | undefined;
  rangeName: string | null;
  name: string | null;
  imageUrl: string | null;
}

export const AttackCard = React.memo(
  ({ msg, rangeName, weapon, name, imageUrl }: AttackCardProps) => {
    const onClickWeaponName = useCallback(() => {
      void weapon?.sheet?.render(true);
    }, [weapon?.sheet]);

    const img = weapon?.img ?? imageUrl;

    // @ts-expect-error v10 types
    const poolRolls = (msg.rolls?.[0]?.terms[0] as PoolTerm).rolls;
    const hitRoll = poolRolls[0];
    const damageRoll = poolRolls[1];

    return (
      <div
        className="dice-roll"
        css={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          gridTemplateRows: "max-content minmax(0, max-content) max-content",
          gridTemplateAreas:
            '"image headline" ' +
            '"image hit-terms" ' +
            '"image hit-body" ' +
            '"image damage-terms" ' +
            '"image damage-body" ',
          alignItems: "center",
        }}
      >
        {/* IMAGE */}
        <div
          css={{
            height: "4em",
            width: "4em",
            gridArea: "image",
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            transform: "scale(0.9) rotate(-5deg)",
            boxShadow: "0 0 0.5em black",
            marginRight: "1em",
            alignSelf: "start",
          }}
        />
        {/* HEADLINE */}
        <div
          css={{
            gridArea: "headline",
          }}
        >
          <b>
            <a onClick={onClickWeaponName}>{name ?? weapon?.name}</a>
          </b>{" "}
          (<Translate>{rangeName || ""}</Translate>)
        </div>
        {/* HIT TERMS */}

        <div
          css={{
            gridArea: "hit-terms",
          }}
        >
          <Translate>Hit roll</Translate>
          {": "}
          <DiceTerms terms={hitRoll.terms} />
          {" ="}
        </div>
        {/* HIT RESULT */}
        <a
          className="dice-total"
          css={{
            gridArea: "hit-body",
          }}
        >
          {hitRoll.total}
        </a>

        {/* DAMAGE TERMS */}

        <div
          css={{
            gridArea: "damage-terms",
          }}
        >
          <Translate>Damage</Translate>
          {": "}
          <DiceTerms terms={damageRoll.terms} />
          {" ="}
        </div>
        {/* DAMAGE RESULT */}
        <a
          className="dice-total"
          css={{
            gridArea: "damage-body",
          }}
        >
          {damageRoll.total}
        </a>
      </div>
    );
  },
);

AttackCard.displayName = "AttackCard";
