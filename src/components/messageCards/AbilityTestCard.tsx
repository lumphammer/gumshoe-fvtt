import React, { useCallback } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { Translate } from "../Translate";
import { DiceTerms } from "./DiceTerms";
import { AbilityCardMode } from "./types";

interface AbilityTestCardProps {
  msg: ChatMessage;
  ability: InvestigatorItem | undefined;
  mode: AbilityCardMode;
  name: string | null;
  imageUrl: string | null;
}

export const AbilityTestCard = React.memo(
  ({ msg, ability, mode, name, imageUrl }: AbilityTestCardProps) => {
    const sheet = ability?.sheet;
    assertApplicationV2(sheet);

    const onClickAbilityName = useCallback(() => {
      void sheet.render({ force: true });
    }, [sheet]);

    return (
      <div
        className="dice-roll"
        css={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          gridTemplateRows: "max-content minmax(0, max-content) max-content",
          gridTemplateAreas:
            '"image headline" ' + '"image terms" ' + '"image body" ',
          alignItems: "center",
        }}
      >
        {/* IMAGE */}
        <div
          css={{
            height: "4em",
            width: "4em",
            gridArea: "image",
            backgroundImage: `url(${ability?.img ?? imageUrl})`,
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
            <a onClick={onClickAbilityName}>
              {name ?? ability?.name ?? "Missing"}
            </a>
          </b>
        </div>
        {/* TERMS */}
        <div
          css={{
            gridArea: "terms",
          }}
        >
          {mode === "spend" && <Translate>PointSpend</Translate>}
          {mode === "test" && (
            <>
              <Translate>AbilityTest</Translate>
              {": "}
              <DiceTerms terms={msg.rolls?.[0]?.terms} />
              {" ="}
            </>
          )}
        </div>
        {/* RESULT */}
        <a
          className="dice-total"
          css={{
            gridArea: "body",
            "&&": {
              marginTop: "0.5em",
            },
          }}
        >
          {msg.rolls?.[0]?.total}
        </a>
      </div>
    );
  },
);

AbilityTestCard.displayName = "AbilityTestCard";
