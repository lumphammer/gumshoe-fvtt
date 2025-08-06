import { ReactNode } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { InvestigatorActor } from "../../module/actors/InvestigatorActor";
import { AbilityItem, isAbilityItem } from "../../module/items/exports";
import { runtimeConfig } from "../../runtime";
import { settings } from "../../settings/settings";
import { AbilityRowData } from "./types";

type AbilityRowProps = {
  abilityRowData: AbilityRowData;
  index: number;
  actors: InvestigatorActor[];
};

export const AbilityRow = ({
  abilityRowData,
  index,
  actors,
}: AbilityRowProps) => {
  const theme =
    runtimeConfig.themes[settings.defaultThemeName.get()] ||
    runtimeConfig.themes["tealTheme"];

  const zero = abilityRowData.total === 0;
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
    <>
      {/* Ability name */}
      <div
        css={{
          gridRow: index + 2,
          backgroundColor: headerBg,
          padding: "0.5em",
          textAlign: "left",
          position: "sticky",
          left: 0,
        }}
      >
        {abilityRowData.abilityItem.name}
      </div>

      {/* Ability scores */}
      {actors.map<ReactNode>((actor, j) => {
        if (actor === undefined || actor.id === null) {
          return null;
        }
        const actorInfo = abilityRowData.actorInfo[actor.id];
        return (
          <a
            key={actor.id}
            onClick={async (e) => {
              e.preventDefault();
              const ability = actorInfo.abilityId
                ? actor.items.get(actorInfo.abilityId)
                : undefined;
              if (ability) {
                const sheet = ability.sheet;
                assertApplicationV2(sheet);
                void sheet.render({ force: true });
              } else {
                const confirmed = await confirmADoodleDo({
                  message:
                    "{ActorName} does not have {AbilityName}. Add it now?",
                  confirmText: "Yes please!",
                  cancelText: "No thanks",
                  confirmIconClass: "fa-check",
                  resolveFalseOnCancel: true,
                  values: {
                    ActorName: actor.name ?? "",
                    AbilityName: abilityRowData.abilityItem.name ?? "",
                  },
                });
                if (!confirmed) {
                  return;
                }
                const newAbility = (
                  await actor.createEmbeddedDocuments("Item", [
                    abilityRowData.abilityItem.toJSON(),
                  ])
                )?.[0] as AbilityItem;
                if (isAbilityItem(newAbility)) {
                  const sheet = newAbility.sheet;
                  assertApplicationV2(sheet);
                  void sheet.render({ force: true });
                }
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
        {abilityRowData.total}
      </div>
    </>
  ); //
};
