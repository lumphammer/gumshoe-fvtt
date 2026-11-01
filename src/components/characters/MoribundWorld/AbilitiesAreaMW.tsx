import { memo } from "react";

import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSnapshot } from "../../../hooks/useActorSnapshot";
import { useSettings } from "../../../hooks/useSettings";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { getCategorizedAbilitiesIn } from "../../../module/actors/abilitiesDerived";
import { assertPCActor } from "../../../module/actors/pc";
import type { AbilityItem } from "../../../module/items/exports";
import { AbilitiesColumnMW } from "../AbilitiesColumnMW";

/**
 * Moribund World's abilities, to test. Reads the actor through a snapshot,
 * selecting only which abilities go where: each row reads its own ability,
 * so a change to one ability re-renders only its row.
 */
export const AbilitiesAreaMW = memo(function AbilitiesAreaMW() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const settings = useSettings((s) => s);

  const generalAbilities = useActorSnapshot(actor, (snapshot) => {
    const { generalAbilities } = getCategorizedAbilitiesIn(
      snapshot?.items ?? [],
      { hideZeroRated: true, hidePushPool: false },
      settings,
    );
    return Object.fromEntries(
      Object.entries(generalAbilities).map(([cat, items]) => [
        cat,
        sortEntitiesByName(items).map((item) => item._id ?? ""),
      ]),
    );
  });

  // the live abilities, only to pass to the rows (which read them through
  // snapshots, and write to them)
  const getAbilities = (ids: string[]) =>
    ids.flatMap((id) => {
      const ability = actor.items.get(id) as AbilityItem | undefined;
      return ability ? [ability] : [];
    });

  return (
    <div
      css={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        columnGap: "1em",
        rowGap: "1em",
      }}
    >
      {Object.keys(generalAbilities).map((cat) => {
        const abilities = getAbilities(generalAbilities[cat]);
        const lordyItsABigOne = abilities.length >= 6;
        if (lordyItsABigOne) {
          const part1 = abilities.slice(0, abilities.length >> 1);
          const part2 = abilities.slice(abilities.length >> 1);
          return (
            <div
              key={cat}
              css={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridAutoRows: "min-content",
                columnGap: "1em",
                rowGap: "0.4em",
                alignItems: "center",
                gridColumn: "1/-1",
              }}
            >
              <h2 css={{ gridColumn: "1 / -1" }}>{cat}</h2>
              <AbilitiesColumnMW abilities={part1} />
              <AbilitiesColumnMW abilities={part2} />
            </div>
          );
        } else {
          return (
            <div key={cat}>
              <h2 css={{ gridColumn: "1 / -1" }}>{cat}</h2>
              <AbilitiesColumnMW abilities={abilities} />
            </div>
          );
        }
      })}
    </div>
  );
});
