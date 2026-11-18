import { Fragment, memo } from "react";

import { liveItem } from "../../functions/liveItems";
import { isAbilityItem } from "../../module/items/exports";
import { getTranslated } from "../../functions/getTranslated";
import { useActorAndSettings } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import {
  getAbilityRowsIn,
  getCategorizedAbilitiesIn,
  getPushPoolWarningKeysIn,
  hasRegularInvestigativeAbilitiesIn,
  sumRatingsIn,
} from "../../module/actors/abilitiesDerived";
import { assertActiveCharacterActor } from "../../module/actors/types";
import { AbilitySlugEdit } from "./AbilitySlugEdit";
import { AbilitySlugEditQuickShockInvestigative } from "./AbilitySlugEditQuickShockInvestigative";
import { BuildPointsBar } from "./BuildPointsBar";
import { NoAbilitiesNote } from "./NoAbilitiesNote";
import { Callout } from "../Callout";
import { displayText, sectionHeading } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";

type AbilitiesAreaEditProps = {
  npcMode?: boolean;
};

/**
 * The character's abilities, to set their ratings. Reads the actor through a
 * snapshot, selecting only which abilities go where (and the totals): each row
 * reads its own ability, so a change to one ability re-renders only its row.
 */
export const AbilitiesAreaEdit = memo(function AbilitiesAreaEdit({
  npcMode = false,
}: AbilitiesAreaEditProps) {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const mwMode = useSettings((s) => s.useMwStyleAbilities);

  const layout = useActorAndSettings(actor, (snapshot, settings) => {
    const items = snapshot.items;
    const { investigativeAbilities, generalAbilities } =
      getCategorizedAbilitiesIn(
        items,
        { hideZeroRated: false, hidePushPool: false },
        settings,
      );
    return {
      investigativeAbilities: getAbilityRowsIn(investigativeAbilities),
      generalAbilities: getAbilityRowsIn(generalAbilities),
      investigativeTotal: sumRatingsIn(investigativeAbilities),
      generalTotal: sumRatingsIn(generalAbilities),
      hasRegularInvestigativeAbilities:
        hasRegularInvestigativeAbilitiesIn(items),
      pushPoolWarningKeys: getPushPoolWarningKeysIn(items),
    };
  });
  const { investigativeAbilities, generalAbilities } = layout;

  // the live abilities, only to pass to the rows (which read them through
  // snapshots, and write to them)
  const getAbility = (id: string) => liveItem(actor, id, isAbilityItem);

  // this is all a bit iffy-elsey, but...

  //  in MW mode, we hide the investigative abilities
  // we're in "simplified mode" if it's an NPC or we're using MW style
  const simplifiedMode = npcMode || mwMode;

  // even when not simplified, we hide the "occupational" column if there are
  // no non-quickshock investigative abilities
  const showInvestigativeOccupationalColumn =
    !simplifiedMode && layout.hasRegularInvestigativeAbilities;

  // warnings from having weirdly set up push pools
  const pushPoolWarnings = layout.pushPoolWarningKeys.map((key) =>
    getTranslated(key),
  );

  return (
    <>
      {!npcMode && (
        <BuildPointsBar
          investigativeTotal={layout.investigativeTotal}
          generalTotal={layout.generalTotal}
          showInvestigative={!mwMode}
        />
      )}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "minmax(33%, auto) minmax(33%, auto)",
          columnGap: "1em",
          marginBottom: "1em",
        })}
        style={{
          gridTemplateAreas:
            "'warnings warnings'" +
            (simplifiedMode
              ? "'general investigative'"
              : "'investigative general'"),
        }}
      >
        <div className={css({ gridArea: "warnings" })}>
          {pushPoolWarnings.map((warning, i) => (
            <Callout
              key={i}
              tone="warning"
              className={css({ marginBottom: "0.5em" })}
            >
              {warning}
            </Callout>
          ))}
        </div>
        {!mwMode && (
          <div
            className={css({
              gridArea: "investigative",
              display: "grid",
              gridTemplateAreas: "'ability rating isocc'",
              columnGap: "0.5em",
              rowGap: "0.1em",
              alignItems: "center",
              alignContent: "start",
            })}
            style={{
              gridTemplateColumns: showInvestigativeOccupationalColumn
                ? "1fr max-content auto"
                : "1fr max-content",
            }}
          >
            {simplifiedMode || (
              <i
                className={cx(
                  displayText({ size: "sm" }),
                  css({
                    gridColumn: "rating",
                  }),
                )}
              >
                Rating
              </i>
            )}
            {showInvestigativeOccupationalColumn && (
              <i
                className={cx(
                  displayText({ size: "sm" }),
                  css({
                    gridColumn: "isocc",
                  }),
                )}
                title="Occupational Ability"
              >
                Oc.
              </i>
            )}
            {Object.keys(investigativeAbilities).map((cat) => (
              <Fragment key={cat}>
                <h2
                  className={cx(
                    sectionHeading(),
                    css({ gridColumn: "1 / -1" }),
                  )}
                >
                  {cat}
                </h2>
                {investigativeAbilities[cat].map(({ id, isQuickShock }) => {
                  const ability = getAbility(id);
                  if (!ability) return null;
                  return isQuickShock ? (
                    <AbilitySlugEditQuickShockInvestigative
                      key={id}
                      ability={ability}
                    />
                  ) : (
                    <AbilitySlugEdit
                      key={id}
                      ability={ability}
                      showOcc={showInvestigativeOccupationalColumn}
                    />
                  );
                })}
                {investigativeAbilities[cat].length === 0 && (
                  <NoAbilitiesNote />
                )}
              </Fragment>
            ))}
          </div>
        )}

        <div
          className={css({
            gridArea: "general",
            display: "grid",
            gridTemplateAreas: "'ability rating isocc'",
            columnGap: "0.5em",
            rowGap: "0.1em",
            alignItems: "center",
            alignContent: "start",
          })}
          style={{
            gridTemplateColumns: simplifiedMode
              ? "1fr max-content"
              : "1fr max-content auto",
          }}
        >
          {simplifiedMode || (
            <i
              className={cx(
                displayText({ size: "sm" }),
                css({
                  gridColumn: "rating",
                }),
              )}
            >
              Rating
            </i>
          )}
          {simplifiedMode || (
            <i
              className={cx(
                displayText({ size: "sm" }),
                css({
                  gridColumn: "isocc",
                }),
              )}
              title="Occupational Ability"
            >
              Oc.
            </i>
          )}

          {Object.keys(generalAbilities).map((cat) => (
            <Fragment key={cat}>
              <h2
                className={cx(sectionHeading(), css({ gridColumn: "1 / -1" }))}
              >
                {cat}
              </h2>
              {generalAbilities[cat].map(({ id }) => {
                const ability = getAbility(id);
                return ability ? (
                  <AbilitySlugEdit
                    key={id}
                    ability={ability}
                    showOcc={!simplifiedMode}
                  />
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
