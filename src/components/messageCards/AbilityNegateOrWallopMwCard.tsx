import React from "react";

import * as constants from "../../constants";
import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useMaybeItemSelector } from "../../hooks/useItemSnapshot";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { Translate } from "../Translate";
import { MwButton } from "./MwButton";
import { MwCostSlug } from "./MwCostSlug";
import type { MWResult } from "./types";

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

export const AbilityNegateOrWallopMwCard = React.memo(
  ({ msg, ability, pool, mode, name }: AbilityNegateOrWallopMwCardProps) => {
    "use memo";

    // the ability's own name and picture, as they are now
    const header = useMaybeItemSelector(ability, (snapshot) =>
      snapshot ? { name: snapshot.name, img: snapshot.img ?? null } : null,
    );

    const onClickAbilityName = () => {
      const sheet = ability?.sheet;
      if (!sheet) return;
      assertApplicationV2(sheet);
      void sheet.render({ force: true });
    };

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
              {name ?? header?.name ?? "Missing"}
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
  },
);

AbilityNegateOrWallopMwCard.displayName = "AbilityNegateOrWallopMwCard";
