import type { TraumaType } from "@lumphammer/investigator-fvtt-types";
import { Fragment, useContext } from "react";

import type { PCActor } from "../../module/actors/pc";
import {
  adaptationThreshold,
  adaptedRatingCap,
  getBondCap,
  getProgressAfterClick,
} from "../../module/bonds/adaptation";
import { getAdaptableTraumaTypes } from "../../module/stability/settings";
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
export const AdaptationTracker = ({ actor }: { actor: PCActor }) => {
  const theme = useContext(ThemeContext);
  const boxes = Array.from({ length: adaptationThreshold }, (_, i) => i + 1);

  return (
    <div data-testid="adaptations" css={{ marginTop: "1em" }}>
      <h3 css={{ borderBottom: `1px solid ${theme.colors.text}` }}>
        <Translate>Adapted to</Translate>
      </h3>
      <p css={{ fontSize: "0.9em" }}>
        <Translate
          values={{
            AbilityName: actor.system.getStabilityAbility()?.name ?? "",
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
        {getAdaptableTraumaTypes().map((type) => {
          const progress = actor.system.getAdaptationProgress(type.id);
          const adapted = actor.system.isAdaptedTo(type.id);
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
                    checked={progress >= box}
                    onChange={() =>
                      void actor.system.setAdaptationProgress(
                        type.id,
                        getProgressAfterClick(progress, box),
                      )
                    }
                  />
                ))}
              </div>
              <div>
                {adapted && (
                  <b data-testid={`adapted-${type.id}`}>
                    <Translate>Adapted</Translate>
                  </b>
                )}
              </div>
              {adapted && effects.length > 0 && (
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
};

AdaptationTracker.displayName = "AdaptationTracker";
