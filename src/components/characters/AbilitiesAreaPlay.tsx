import { Fragment, memo, useContext } from "react";

import { sortEntitiesByName } from "../../functions/utilities";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import {
  getCategorizedAbilitiesIn,
  getPushPoolIn,
} from "../../module/actors/abilitiesDerived";
import type { ItemView } from "../../module/actors/pcDerived";
import { assertActiveCharacterActor } from "../../module/actors/types";
import type { AbilityItem } from "../../module/items/exports";
import { getPoolOf } from "../../module/items/findGeneralAbility";
import { ThemeContext } from "../../themes/ThemeContext";
import { AbilitySlugPlayNormal } from "./AbilitySlugPlayNormal";
import { AbilitySlugPlayQuickShockInvestigative } from "./AbilitySlugPlayQuickShockInvestigative";
import { NoAbilitiesNote } from "./NoAbilitiesNote";

type AbilitiesAreaPlayProps = {
  flipLeftRight?: boolean;
};

/** Each category's abilities, in order, as the rows need them */
const toRows = (abilities: Record<string, ItemView[]>) =>
  Object.fromEntries(
    Object.entries(abilities).map(([cat, items]) => [
      cat,
      sortEntitiesByName(items).map((item) => ({
        id: item._id ?? "",
        isQuickShock: Boolean(
          (item.system as { isQuickShock?: boolean }).isQuickShock,
        ),
      })),
    ]),
  );

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
  const theme = useContext(ThemeContext);
  const settings = useSettings((s) => s);
  const showEmpty = settings.showEmptyInvestigativeCategories;

  const layout = useActorSnapshot(actor, (snapshot) => {
    const items = snapshot?.items ?? [];
    const { investigativeAbilities, generalAbilities } =
      getCategorizedAbilitiesIn(
        items,
        { hideZeroRated: true, hidePushPool: true },
        settings,
      );
    return {
      investigativeAbilities: toRows(investigativeAbilities),
      generalAbilities: toRows(generalAbilities),
      pushPoolIsZero: getPoolOf(getPushPoolIn(items)) === 0,
    };
  });
  const { investigativeAbilities, generalAbilities, pushPoolIsZero } = layout;

  // the live abilities, only to pass to the rows (which read them through
  // snapshots, and write to them)
  const getAbility = (id: string) =>
    actor.items.get(id) as AbilityItem | undefined;

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
                <h2
                  css={{
                    gridColumn: "1 / -1",
                    borderWidth: "1px",
                    borderStyle: "none none solid none",
                    borderColor: theme.colors.text,
                  }}
                >
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
              <h2
                css={{
                  gridColumn: "1 / -1",
                  borderWidth: "1px",
                  borderStyle: "none none solid none",
                  borderColor: theme.colors.text,
                }}
              >
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
