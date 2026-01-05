import { Fragment, useContext } from "react";

import { sortEntitiesByName } from "../../functions/utilities";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertActiveCharacterActor } from "../../module/actors/types";
import { settings } from "../../settings/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { AbilitySlugPlayNormal } from "./AbilitySlugPlayNormal";
import { AbilitySlugPlayQuickShockInvestigative } from "./AbilitySlugPlayQuickShockInvestigative";
import { NoAbilitiesNote } from "./NoAbilitiesNote";

type AbilitiesAreaPlayProps = {
  flipLeftRight?: boolean;
};

export const AbilitiesAreaPlay = ({
  flipLeftRight,
}: AbilitiesAreaPlayProps) => {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const { investigativeAbilities, generalAbilities } =
    actor.system.getCategorizedAbilities(true, true);
  const theme = useContext(ThemeContext);

  const pushPool = actor.system.getPushPool();
  const pushPoolIsZero = pushPool === undefined || pushPool.system.pool === 0;

  const showEmpty = settings.showEmptyInvestigativeCategories.get();

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
                {sortEntitiesByName(investigativeAbilities[cat]).map(
                  (ability) => {
                    if (ability.system.isQuickShock) {
                      return (
                        <AbilitySlugPlayQuickShockInvestigative
                          key={ability.id}
                          ability={ability}
                          disabled={pushPoolIsZero}
                        />
                      );
                    } else {
                      return (
                        <AbilitySlugPlayNormal
                          key={ability.id}
                          ability={ability}
                        />
                      );
                    }
                  },
                )}
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
              {sortEntitiesByName(generalAbilities[cat]).map((ability) => (
                <AbilitySlugPlayNormal key={ability.id} ability={ability} />
              ))}
              {generalAbilities[cat].length === 0 && <NoAbilitiesNote />}
            </Fragment>
          ))}
        </div>
      </div>
    </>
  );
};
