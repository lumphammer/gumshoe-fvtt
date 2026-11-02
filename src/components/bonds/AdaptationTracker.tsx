import type { TraumaType } from "@lumphammer/investigator-fvtt-types";
import { Fragment, memo, useContext } from "react";

import { useActorAndSettings } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { PCActor } from "../../module/actors/pc";
import {
  getStabilityViewIn,
  isAdaptedToIn,
} from "../../module/actors/pcDerived";
import {
  adaptationThreshold,
  adaptedRatingCap,
  getBondCap,
  getProgressAfterClick,
} from "../../module/bonds/adaptation";
import { getAdaptableTraumaTypesFrom } from "../../module/stability/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { Checkbox } from "../inputs/Checkbox";
import { Translate } from "../Translate";

/** What being adapted does, in our words: nothing, for some types */
const getEffects = (type: TraumaType) => {
  const names = type.cappedAbilities;
  return [
    names.length > 0 && (
      <Translate
        key="abilities"
        values={{
          AbilityNames: new Intl.ListFormat(game.i18n?.lang).format(names),
          RatingCap: String(adaptedRatingCap),
        }}
      >
        AdaptationCapsAbilitiesEffect
      </Translate>
    ),
    type.capsBonds && (
      <Translate key="bonds" values={{ BondCap: String(getBondCap(true)) }}>
        AdaptationCapsBondsEffect
      </Translate>
    ),
    type.refreshPenalty > 0 && (
      <Translate
        key="refresh"
        values={{ Penalty: String(type.refreshPenalty) }}
      >
        AdaptationRefreshPenaltyEffect
      </Translate>
    ),
  ].filter((effect) => effect !== false);
};

/**
 * Progress towards adapting to trauma (Fall of DELTA GREEN, p. 120), boxes
 * ticked as on the paper sheet. Trauma tests tick them too.
 */
export const AdaptationTracker = memo(function AdaptationTracker({
  actor,
}: {
  actor: PCActor;
}) {
  "use memo";

  const theme = useContext(ThemeContext);
  const types = useSettings(
    (s) => getAdaptableTraumaTypesFrom(s) as TraumaType[],
  );
  // the Stability ability's name, and each type's progress and whether it's
  // adapted to (as `getAdaptationProgress` and `isAdaptedTo` work them out)
  const { stabilityName, progress, adapted } = useActorAndSettings(
    actor,
    (pc, settings) => ({
      stabilityName: getStabilityViewIn(pc.items, settings)?.name ?? "",
      progress: Object.fromEntries(
        types.map((type) => [type.id, pc.system.adaptations[type.id] ?? 0]),
      ),
      adapted: Object.fromEntries(
        types.map((type) => [type.id, isAdaptedToIn(pc, type.id, settings)]),
      ),
    }),
  );
  const { setAdaptationProgress } = useSystemMethods(actor);
  const boxes = Array.from({ length: adaptationThreshold }, (_, i) => i + 1);

  return (
    <div data-testid="adaptations" css={{ marginTop: "1em" }}>
      <h3 css={{ borderBottom: `1px solid ${theme.colors.text}` }}>
        <Translate>Adapted to</Translate>
      </h3>
      <p css={{ fontSize: "0.9em" }}>
        <Translate
          values={{
            AbilityName: stabilityName,
            Count: String(adaptationThreshold),
          }}
        >
          AdaptationHint
        </Translate>
      </p>
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "max-content max-content 1fr",
          columnGap: "0.5em",
          rowGap: "0.25em",
          alignItems: "center",
        }}
      >
        {types.map((type) => {
          const typeProgress = progress[type.id] ?? 0;
          const isAdapted = adapted[type.id] ?? false;
          const effects = getEffects(type);
          return (
            <Fragment key={type.id}>
              <div>{type.name}</div>
              <div
                data-testid={`adaptation-${type.id}`}
                css={{ display: "flex", gap: "0.25em" }}
              >
                {boxes.map((box) => (
                  <Checkbox
                    key={box}
                    checked={typeProgress >= box}
                    onChange={() =>
                      void setAdaptationProgress(
                        type.id,
                        getProgressAfterClick(typeProgress, box),
                      )
                    }
                  />
                ))}
              </div>
              <div>
                {isAdapted && (
                  <b data-testid={`adapted-${type.id}`}>
                    <Translate>Adapted</Translate>
                  </b>
                )}
              </div>
              {isAdapted && effects.length > 0 && (
                <div
                  css={{
                    gridColumn: "1/-1",
                    fontSize: "0.9em",
                    paddingLeft: "1em",
                  }}
                >
                  {effects.map((effect, i) => (
                    <Fragment key={i}>
                      {i > 0 && " "}
                      {effect}
                    </Fragment>
                  ))}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
});

AdaptationTracker.displayName = "AdaptationTracker";
