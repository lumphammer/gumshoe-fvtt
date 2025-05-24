import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertPCActor } from "../../../module/actors/pc";
import { AbilitiesColumnMW } from "../AbilitiesColumnMW";

export const AbilitiesAreaMW = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const { generalAbilities } = actor.system.getCategorizedAbilities(
    true,
    false,
  );

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
        const lordyItsABigOne = generalAbilities[cat].length >= 6;
        if (lordyItsABigOne) {
          const abilities = sortEntitiesByName(generalAbilities[cat]);
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
              <AbilitiesColumnMW
                abilities={sortEntitiesByName(generalAbilities[cat])}
              />
            </div>
          );
        }
      })}
    </div>
  );
};
