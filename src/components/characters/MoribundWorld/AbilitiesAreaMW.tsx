import { memo } from "react";

import { liveItems } from "../../../functions/liveItems";
import { isAbilityItem } from "../../../module/items/exports";
import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorAndSettings } from "../../../hooks/useActorSnapshot";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { getCategorizedAbilitiesIn } from "../../../module/actors/abilitiesDerived";
import { assertPCActor } from "../../../module/actors/pc";
import { AbilitiesColumnMW } from "../AbilitiesColumnMW";

/**
 * Moribund World's abilities, to test. Reads the actor through a snapshot,
 * selecting only which abilities go where: each row reads its own ability,
 * so a change to one ability re-renders only its row.
 */
export const AbilitiesAreaMW = memo(function AbilitiesAreaMW() {
  "use memo";

  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const generalAbilities = useActorAndSettings(actor, (snapshot, settings) => {
    const { generalAbilities } = getCategorizedAbilitiesIn(
      snapshot.items,
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
  const getAbilities = (ids: string[]) => liveItems(actor, ids, isAbilityItem);

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
