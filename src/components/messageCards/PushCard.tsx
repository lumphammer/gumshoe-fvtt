import React from "react";

import { useTheme } from "../../hooks/useTheme";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { Translate } from "../Translate";
import { useAbilityCardHeader } from "./useAbilityCardHeader";
import type { AbilityCardMode } from "./types";

interface PushCardProps {
  msg: ChatMessage;
  ability: InvestigatorItem | undefined;
  mode: AbilityCardMode;
  name: string | null;
  imageUrl: string | null;
}

const shadowOffset = "1px";
const shadowBlur = "1px";

export const PushCard = React.memo(
  ({ msg, ability, mode, name, imageUrl }: PushCardProps) => {
    "use memo";

    const theme = useTheme();
    const { header, openSheet: onClickAbilityName } =
      useAbilityCardHeader(ability);

    return (
      <div
        className="dice-roll"
        css={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          gridTemplateRows: "auto",
          gridTemplateAreas: '"image headline"',
          alignItems: "center",
          justifyItems: "start",
        }}
      >
        {/* IMAGE */}
        <div
          css={{
            height: "4em",
            width: "4em",
            gridArea: "image",
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            justifyItems: "center",
            transform: "scale(0.9) rotate(-5deg)",
            boxShadow: "0 0 0.5em black",
            marginRight: "1em",
            // alignSelf: "start",
          }}
        />
        {/* TERMS */}
        <a
          onClick={onClickAbilityName}
          css={{
            gridArea: "headline",
            fontSize: "1.5em",
            color: theme.colors.accent,
            fontStyle: "italic",
            textShadow: `
            -${shadowOffset} -${shadowOffset} ${shadowBlur} #0007,
            ${shadowOffset} ${shadowOffset} ${shadowBlur} #fff
          `,
            ":hover": {
              textShadow: `
              0 0 10px #fff,
              0 0 10px #fff,
              -${shadowOffset} -${shadowOffset} ${shadowBlur} #0007,
              ${shadowOffset} ${shadowOffset} ${shadowBlur} #fff
            `,
            },
          }}
        >
          <Translate values={{ AbilityName: header?.name ?? "" }}>
            AbilityNamePush
          </Translate>
        </a>
      </div>
    );
  },
);

PushCard.displayName = "AbilityTestCard";
