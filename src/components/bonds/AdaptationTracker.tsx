import { Fragment, useContext } from "react";

import type { PCActor } from "../../module/actors/pc";
import type { Adaptation } from "../../module/bonds/adaptation";
import {
  adaptations,
  adaptationThreshold,
  adaptedToHelplessnessRefreshPenalty,
  adaptedToViolenceRatingCap,
  getBondCap,
  getProgressAfterClick,
} from "../../module/bonds/adaptation";
import { settings } from "../../settings/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { Checkbox } from "../inputs/Checkbox";
import { Hint } from "../inputs/Hint";
import { Translate } from "../Translate";

const labels: Record<Adaptation, string> = {
  violence: "Violence",
  helplessness: "Helplessness",
};

/** What Adapted to Violence does, and a warning if no abilities are set */
const getViolenceEffect = () => {
  const names = settings.violenceCappedAbilities.get();
  if (names.length === 0) {
    return (
      <>
        <Translate values={{ BondCap: String(getBondCap(true)) }}>
          AdaptedToViolenceBondsOnlyEffect
        </Translate>
        <Hint severity="warning">
          <Translate>NoViolenceCappedAbilitiesWarning</Translate>
        </Hint>
      </>
    );
  }
  return (
    <Translate
      values={{
        AbilityNames: new Intl.ListFormat(game.i18n?.lang).format(names),
        RatingCap: String(adaptedToViolenceRatingCap),
        BondCap: String(getBondCap(true)),
      }}
    >
      AdaptedToViolenceEffect
    </Translate>
  );
};

/** What being adapted does, in our words */
const getEffect = (adaptation: Adaptation) =>
  adaptation === "violence" ? (
    getViolenceEffect()
  ) : (
    <Translate
      values={{ Penalty: String(adaptedToHelplessnessRefreshPenalty) }}
    >
      AdaptedToHelplessnessEffect
    </Translate>
  );

/**
 * Progress towards adapting to trauma (Fall of DELTA GREEN, p. 120), boxes
 * ticked by hand as on the paper sheet: nothing here knows about Stability
 * tests by kind of trauma yet.
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
            AbilityName: actor.system.getBondStabilityAbility()?.name ?? "",
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
        {adaptations.map((adaptation) => {
          const progress = actor.system.adaptations[adaptation];
          const adapted = actor.system.isAdaptedTo(adaptation);
          return (
            <Fragment key={adaptation}>
              <div>
                <Translate>{labels[adaptation]}</Translate>
              </div>
              <div
                data-testid={`adaptation-${adaptation}`}
                css={{ display: "flex", gap: "0.25em" }}
              >
                {boxes.map((box) => (
                  <Checkbox
                    key={box}
                    checked={progress >= box}
                    onChange={() =>
                      void actor.system.setAdaptationProgress(
                        adaptation,
                        getProgressAfterClick(progress, box),
                      )
                    }
                  />
                ))}
              </div>
              <div>
                {adapted && (
                  <b data-testid={`adapted-${adaptation}`}>
                    <Translate>Adapted</Translate>
                  </b>
                )}
              </div>
              {adapted && (
                <div
                  css={{
                    gridColumn: "1/-1",
                    fontSize: "0.9em",
                    paddingLeft: "1em",
                  }}
                >
                  {getEffect(adaptation)}
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
