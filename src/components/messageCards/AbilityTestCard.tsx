import React, { Fragment, useCallback } from "react";
import { InvestigatorItem } from "../../module/InvestigatorItem";
import { DiceTerms } from "./DiceTerms";
import { AbilityCardMode } from "./types";
import { Translate } from "../Translate";

interface AbilityTestCardProps {
  msg: ChatMessage;
  ability: InvestigatorItem | undefined;
  mode: AbilityCardMode;
  name: string | null;
  imageUrl: string | null;
}

export const AbilityTestCard: React.FC<AbilityTestCardProps> = React.memo(
  ({ msg, ability, mode, name, imageUrl }) => {
    const onClickAbilityName = useCallback(() => {
      ability?.sheet?.render(true);
    }, [ability?.sheet]);

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
            backgroundImage: `url(${ability?.data.img ?? imageUrl})`,
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
              {name ?? ability?.data.name ?? "Missing"}
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
            <Fragment>
              <Translate>AbilityTest</Translate>
              {": "}
              <DiceTerms terms={msg.roll?.terms} />
              {" ="}
            </Fragment>
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
          {msg.roll?.total}
        </a>
      </div>
    );
  },
);

AbilityTestCard.displayName = "AbilityTestCard";
