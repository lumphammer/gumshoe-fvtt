import type { ReactNode } from "react";

import { openSheet } from "../../functions/openSheet";
import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import type { AbilityItem } from "../../module/items/exports";
import { isAbilityItem } from "../../module/items/exports";
import type { AbilityRowData, PartyMemberView } from "./types";
import { partyCell } from "../../styled-system/recipes";

type AbilityRowProps = {
  abilityRowData: AbilityRowData;
  index: number;
  actors: readonly PartyMemberView[];
};

/**
 * Open the member's copy of the ability, or offer to give them one (copied
 * from the row's ability) if they haven't got it.
 */
const openOrAddAbility = async (
  abilityRowData: AbilityRowData,
  actorId: string,
  abilityUuid: string | undefined,
) => {
  if (abilityUuid) {
    openSheet(fromUuidSync(abilityUuid) as { sheet: unknown } | null);
    return;
  }
  const actor = game.actors?.get(actorId);
  if (!actor) return;
  const confirmed = await confirmADoodleDo({
    message: "{ActorName} does not have {AbilityName}. Add it now?",
    confirmText: "Yes please!",
    cancelText: "No thanks",
    confirmIconClass: "fa-check",
    resolveFalseOnCancel: true,
    values: {
      ActorName: actor.name ?? "",
      AbilityName: abilityRowData.ability.name,
    },
  });
  if (!confirmed) {
    return;
  }
  const original = await fromUuid(abilityRowData.ability.uuid);
  if (!isAbilityItem(original)) {
    return;
  }
  const source = original.toJSON();
  if (abilityRowData.isExtra) {
    // the representative for an extra row is another PC's own copy, so start
    // the new one from scratch rather than carrying that PC's rating and pool
    // across
    source.system = { ...source.system, rating: 0, pool: 0 };
  }
  const newAbility = (
    await actor.createEmbeddedDocuments("Item", [source])
  )?.[0] as AbilityItem;
  if (isAbilityItem(newAbility)) {
    openSheet(newAbility);
  }
};

export const AbilityRow = ({
  abilityRowData,
  index,
  actors,
}: AbilityRowProps) => {
  const zero = abilityRowData.total === 0;
  const odd = index % 2 === 0;

  return (
    <>
      {/* Ability name */}
      <div
        title={
          abilityRowData.isExtra
            ? getTranslated("Ability not in configured packs")
            : undefined
        }
        className={partyCell({ header: true, odd, zero })}
        css={{
          gridRow: index + 2,
          padding: "0.5em",
          textAlign: "left",
          position: "sticky",
          left: 0,
          // extras aren't part of the configured set, so set them apart
          fontStyle: abilityRowData.isExtra ? "italic" : undefined,
        }}
      >
        {abilityRowData.ability.name}
      </div>

      {/* Ability scores */}
      {actors.map<ReactNode>((actor, j) => {
        const actorInfo = abilityRowData.actorInfo[actor.id];
        return (
          <a
            key={actor.id}
            onClick={(e) => {
              e.preventDefault();
              void openOrAddAbility(
                abilityRowData,
                actor.id,
                actorInfo?.abilityUuid,
              );
            }}
            className={partyCell({ odd, zero })}
            css={{
              display: "block",
              gridRow: index + 2,
              gridColumn: j + 2,
              padding: "0.5em",
              textAlign: "center",
            }}
          >
            {actorInfo?.rating ?? "–"}
          </a>
        );
      })}

      {/* Total */}
      <div
        className={partyCell({ header: true, odd, zero })}
        css={{
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
  );
};
