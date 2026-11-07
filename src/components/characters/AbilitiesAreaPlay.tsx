import { Fragment, memo } from "react";

import { liveItem } from "../../functions/liveItems";
import { isAbilityItem } from "../../module/items/exports";
import { useActorAndSettings } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import {
  getAbilityRowsIn,
  getCategorizedAbilitiesIn,
  getPushPoolIn,
} from "../../module/actors/abilitiesDerived";
import { assertActiveCharacterActor } from "../../module/actors/types";
import { AbilitySlugPlayNormal } from "./AbilitySlugPlayNormal";
import { AbilitySlugPlayQuickShockInvestigative } from "./AbilitySlugPlayQuickShockInvestigative";
import { NoAbilitiesNote } from "./NoAbilitiesNote";
import { sectionHeading } from "../../styled-system/recipes";

type AbilitiesAreaPlayProps = {
  flipLeftRight?: boolean;
};

/**
 * The character's abilities, to spend and test. Reads the actor through a
 * snapshot, selecting only which abilities go where: each row reads its own
 * ability, so a change to one ability re-renders only its row.
 */
export const AbilitiesAreaPlay = memo(function AbilitiesAreaPlay({
  flipLeftRight,
}: AbilitiesAreaPlayProps) {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const showEmpty = useSettings((s) => s.showEmptyInvestigativeCategories);

  const layout = useActorAndSettings(actor, (snapshot, settings) => {
    const items = snapshot.items;
    const { investigativeAbilities, generalAbilities } =
      getCategorizedAbilitiesIn(
        items,
        { hideZeroRated: true, hidePushPool: true },
        settings,
      );
    return {
      investigativeAbilities: getAbilityRowsIn(investigativeAbilities),
      generalAbilities: getAbilityRowsIn(generalAbilities),
      // (no push pool counts as an empty one)
      pushPoolIsZero: (getPushPoolIn(items)?.system.pool ?? 0) === 0,
    };
  });
  const { investigativeAbilities, generalAbilities, pushPoolIsZero } = layout;

  // the live abilities, only to pass to the rows (which read them through
  // snapshots, and write to them)
  const getAbility = (id: string) => liveItem(actor, id, isAbilityItem);

  return (
    <>
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "minmax(33%, auto) minmax(33%, auto)",
          gridTemplateAreas: flipLeftRight
            ? "'general investigative'"
            : "'investigative general'",
          columnGap: "1em",
          marginBottom: "1em",
        }}
      >
        <div
          css={{
            gridArea: "investigative",
            display: "grid",
            gridTemplateAreas: "'ability rating set spend'",
            gridTemplateColumns: "1fr max-content max-content max-content",
            columnGap: "0.2em",
            rowGap: "0.4em",
            alignItems: "center",
            alignContent: "start",
          }}
        >
          {Object.keys(investigativeAbilities).map((cat) =>
            showEmpty || investigativeAbilities[cat].length > 0 ? (
              <Fragment key={cat}>
                <h2 className={sectionHeading()} css={{ gridColumn: "1 / -1" }}>
                  {cat}
                </h2>
                {investigativeAbilities[cat].map(({ id, isQuickShock }) => {
                  const ability = getAbility(id);
                  if (!ability) return null;
                  return isQuickShock ? (
                    <AbilitySlugPlayQuickShockInvestigative
                      key={id}
                      ability={ability}
                      disabled={pushPoolIsZero}
                    />
                  ) : (
                    <AbilitySlugPlayNormal key={id} ability={ability} />
                  );
                })}
                {investigativeAbilities[cat].length === 0 && (
                  <NoAbilitiesNote />
                )}
              </Fragment>
            ) : (
              <span key={cat} />
            ),
          )}
        </div>
        <div
          css={{
            gridArea: "general",
            display: "grid",
            gridTemplateColumns: "1fr max-content max-content max-content",
            gridTemplateAreas: "'ability rating set spend'",
            columnGap: "0.2em",
            rowGap: "0.4em",
            alignItems: "center",
            alignContent: "start",
          }}
        >
          {Object.keys(generalAbilities).map((cat) => (
            <Fragment key={cat}>
              <h2 className={sectionHeading()} css={{ gridColumn: "1 / -1" }}>
                {cat}
              </h2>
              {generalAbilities[cat].map(({ id }) => {
                const ability = getAbility(id);
                return ability ? (
                  <AbilitySlugPlayNormal key={id} ability={ability} />
                ) : null;
              })}
              {generalAbilities[cat].length === 0 && <NoAbilitiesNote />}
            </Fragment>
          ))}
        </div>
      </div>
    </>
  );
});
