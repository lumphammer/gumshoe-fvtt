import { Fragment, memo, useContext } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { sortEntitiesByName } from "../../functions/utilities";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import * as c from "../../constants";
import {
  getCategorizedAbilitiesIn,
  getPushPoolWarningKeysIn,
} from "../../module/actors/abilitiesDerived";
import type { ItemView } from "../../module/actors/pcDerived";
import { assertActiveCharacterActor } from "../../module/actors/types";
import type { AbilityItem } from "../../module/items/exports";
import { ThemeContext } from "../../themes/ThemeContext";
import { AbilitySlugEdit } from "./AbilitySlugEdit";
import { AbilitySlugEditQuickShockInvestigative } from "./AbilitySlugEditQuickShockInvestigative";
import { BuildPointsBar } from "./BuildPointsBar";
import { NoAbilitiesNote } from "./NoAbilitiesNote";

type AbilitiesAreaEditProps = {
  npcMode?: boolean;
};

const systemOf = (item: ItemView) =>
  item.system as { rating?: number; isQuickShock?: boolean };

/** Each category's abilities, in order, as the rows need them */
const toRows = (abilities: Record<string, ItemView[]>) =>
  Object.fromEntries(
    Object.entries(abilities).map(([cat, items]) => [
      cat,
      sortEntitiesByName(items).map((item) => ({
        id: item._id ?? "",
        isQuickShock: Boolean(systemOf(item).isQuickShock),
      })),
    ]),
  );

const sumRatings = (abilities: Record<string, ItemView[]>) =>
  Object.values(abilities)
    .flat()
    .reduce((total, item) => total + (systemOf(item).rating ?? 0), 0);

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
  const theme = useContext(ThemeContext);
  const settings = useSettings((s) => s);

  const layout = useActorSnapshot(actor, (snapshot) => {
    const items = snapshot?.items ?? [];
    const { investigativeAbilities, generalAbilities } =
      getCategorizedAbilitiesIn(
        items,
        { hideZeroRated: false, hidePushPool: false },
        settings,
      );
    return {
      investigativeAbilities: toRows(investigativeAbilities),
      generalAbilities: toRows(generalAbilities),
      investigativeTotal: sumRatings(investigativeAbilities),
      generalTotal: sumRatings(generalAbilities),
      hasRegularInvestigativeAbilities: items.some(
        (item) =>
          item.type === c.investigativeAbility && !systemOf(item).isQuickShock,
      ),
      pushPoolWarningKeys: getPushPoolWarningKeysIn(items),
    };
  });
  const { investigativeAbilities, generalAbilities } = layout;

  // the live abilities, only to pass to the rows (which read them through
  // snapshots, and write to them)
  const getAbility = (id: string) =>
    actor.items.get(id) as AbilityItem | undefined;

  // this is all a bit iffy-elsey, but...

  //  in MW mode, we hide the investigative abilities
  const mwMode = settings.useMwStyleAbilities;
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
        css={{
          display: "grid",
          gridTemplateColumns: "minmax(33%, auto) minmax(33%, auto)",
          gridTemplateAreas:
            "'warnings warnings'" +
            (simplifiedMode
              ? "'general investigative'"
              : "'investigative general'"),
          columnGap: "1em",
          marginBottom: "1em",
        }}
      >
        <div css={{ gridArea: "warnings" }}>
          {pushPoolWarnings.map((warning, i) => (
            <div
              key={i}
              css={{
                background: theme.colors.danger,
                color: theme.colors.accentContrast,
                borderRadius: "0.5em",
                padding: "0.2em 0.7em",
                marginBottom: "0.5em",
              }}
            >
              ⚠️
              {warning}
            </div>
          ))}
        </div>
        {!mwMode && (
          <div
            css={{
              gridArea: "investigative",
              display: "grid",
              gridTemplateAreas: "'ability rating isocc'",
              gridTemplateColumns: showInvestigativeOccupationalColumn
                ? "1fr max-content auto"
                : "1fr max-content",
              columnGap: "0.5em",
              rowGap: "0.1em",
              alignItems: "center",
              alignContent: "start",
            }}
          >
            {simplifiedMode || (
              <i
                css={{
                  gridColumn: "rating",
                  font: theme.displayFont,
                  textTransform: theme.displayFontTextTransform,
                  fontSize: "smaller",
                }}
              >
                Rating
              </i>
            )}
            {showInvestigativeOccupationalColumn && (
              <i
                css={{
                  gridColumn: "isocc",
                  font: theme.displayFont,
                  textTransform: theme.displayFontTextTransform,
                  fontSize: "smaller",
                }}
                title="Occupational Ability"
              >
                Oc.
              </i>
            )}
            {Object.keys(investigativeAbilities).map((cat) => (
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
          css={{
            gridArea: "general",
            display: "grid",
            gridTemplateAreas: "'ability rating isocc'",
            gridTemplateColumns: simplifiedMode
              ? "1fr max-content"
              : "1fr max-content auto",
            columnGap: "0.5em",
            rowGap: "0.1em",
            alignItems: "center",
            alignContent: "start",
          }}
        >
          {simplifiedMode || (
            <i
              css={{
                gridColumn: "rating",
                font: theme.displayFont,
                textTransform: theme.displayFontTextTransform,
                fontSize: "smaller",
              }}
            >
              Rating
            </i>
          )}
          {simplifiedMode || (
            <i
              css={{
                gridColumn: "isocc",
                font: theme.displayFont,
                textTransform: theme.displayFontTextTransform,
                fontSize: "smaller",
              }}
              title="Occupational Ability"
            >
              Oc.
            </i>
          )}

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
