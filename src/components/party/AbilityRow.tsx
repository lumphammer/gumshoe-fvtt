/** @jsx jsx */
import { jsx } from "@emotion/react";
import React, { Fragment } from "react";
import { confirmADoodleDo } from "../../functions";
import { InvestigatorActor } from "../../module/InvestigatorActor";
import { getDefaultThemeName } from "../../settingsHelpers";
import { themes } from "../../themes/themes";
import { AbilityRowData } from "./types";

type AbilityRowProps = {
  abilityData: AbilityRowData,
  index: number,
  actors: InvestigatorActor[],
};

export const AbilityRow: React.FC<AbilityRowProps> = ({
  abilityData,
  index,
  actors,
}) => {
  const theme = themes[getDefaultThemeName()] || themes.tealTheme;

  const zero = abilityData.total === 0;
  const odd = index % 2 === 0;

  const bg = zero
    ? odd
        ? theme.colors.bgTransDangerPrimary
        : theme.colors.bgTransDangerSecondary
    : odd
      ? theme.colors.backgroundPrimary
      : theme.colors.backgroundSecondary;
  const headerBg = zero
    ? odd
        ? theme.colors.bgOpaqueDangerPrimary
        : theme.colors.bgOpaqueDangerSecondary
    : odd
      ? theme.colors.bgOpaquePrimary
      : theme.colors.bgOpaqueSecondary;
  return (
    <Fragment>
      {/* Ability name */}
      <div css={{
        gridRow: index + 2,
        backgroundColor: headerBg,
        padding: "0.5em",
        textAlign: "left",
        position: "sticky",
        left: 0,
      }}>
        {abilityData.name}
      </div>

      {/* Ability scores */}
      {actors.map<JSX.Element|null>((actor, j) => {
        if (actor === undefined || actor.id === null) {
          return null;
        }
        const actorInfo = abilityData.actorInfo[actor.id];
        return (
          <a
            key={actor.id}
            onClick={(e) => {
              e.preventDefault();
              const ability = actorInfo.abilityId ? actor.items.get(actorInfo.abilityId) : undefined;
              if (ability) {
                ability.sheet?.render(true);
              } else {
                confirmADoodleDo({
                  message: "{ActorName} does not have {AbilityName}. Add it now?",
                  confirmText: "Yes please!",
                  cancelText: "No thanks",
                  confirmIconClass: "fa-check",
                  values: {
                    ActorName: actor.name ?? "",
                    AbilityName: abilityData.name,
                  },
                }).then(() => {
                  logger.log("OKAY");
                });
              }
            }}
            css={{
              background: bg,
              display: "block",
              gridRow: index + 2,
              gridColumn: j + 2,
              padding: "0.5em",
              textAlign: "center",
            }}
          >
            {actorInfo?.rating ?? "—"}
          </a>
        );
      })}

      {/* Total */}
      <div
        css={{
          background: headerBg,
          gridRow: index + 2,
          gridColumn: actors.length + 2,
          position: "sticky",
          right: 0,
          padding: "0.5em",
          textAlign: "center",
        }}
      >
        {abilityData.total}
      </div>
    </Fragment>
  ); //
};
