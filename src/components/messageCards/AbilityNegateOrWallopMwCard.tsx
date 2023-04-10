import React, { useCallback } from "react";
import { InvestigatorItem } from "../../module/InvestigatorItem";
import { Translate } from "../Translate";
import { MwButton } from "./MwButton";
import { MWResult } from "./types";
import * as constants from "../../constants";
import { MwCostSlug } from "./MwCostSlug";

type WallopNegateMode =
  | typeof constants.htmlDataModeMwNegate
  | typeof constants.htmlDataModeMwWallop;

interface AbilityNegateOrWallopMwCardProps {
  msg: ChatMessage;
  ability: InvestigatorItem | undefined;
  pool: number;
  mode: WallopNegateMode;
  name: string | null;
}

const deets: { [mode in WallopNegateMode]: MWResult } = {
  [constants.htmlDataModeMwNegate]: {
    color: "#7777ff",
    text: "Negate Illustrious",
  },
  [constants.htmlDataModeMwWallop]: {
    color: "#bbbbbb",
    text: "WALLOP",
  },
};

export const AbilityNegateOrWallopMwCard: React.FC<AbilityNegateOrWallopMwCardProps> =
  React.memo(({ msg, ability, pool, mode, name }) => {
    const onClickAbilityName = useCallback(() => {
      ability?.sheet?.render(true);
    }, [ability?.sheet]);

    const costFactor =
      mode === constants.htmlDataModeMwNegate ? (
        <span>
          <Translate>Negate</Translate>: -{constants.mwNegateCost}
        </span>
      ) : (
        <span>
          <Translate>Wallop</Translate>: -{constants.mwWallopCost}
        </span>
      );

    return (
      <div
        className="dice-roll"
        css={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "max-content minmax(0, max-content) max-content",
          gridTemplateAreas: '"headline" ' + '"pool" ' + '"body" ',
          alignItems: "center",
        }}
      >
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
        {/* POOL */}
        <div
          css={{
            gridArea: "pool",
          }}
        >
          <Translate>Pool</Translate>: {pool}
          <MwCostSlug>{costFactor}</MwCostSlug>
        </div>
        {/* RESULT */}
        <MwButton deets={deets[mode]} />
      </div>
    );
  });

AbilityNegateOrWallopMwCard.displayName = "AbilityNegateOrWallopMwCard";
