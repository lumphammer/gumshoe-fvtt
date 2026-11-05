import type { ReactNode } from "react";
import { memo } from "react";

import * as c from "../../constants";
import { useActiveSituationalModifiers } from "../../hooks/useActiveSituationalModifiers";
import { useActorAndSettings } from "../../hooks/useActorSnapshot";
import { useRatingCap } from "../../hooks/useRatingCaps";
import { useStabilityStateName } from "../../hooks/useStabilityStateName";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import {
  findHealthAbilityIn,
  getStabilityAbilityIn,
  getStabilityStateIn,
} from "../../module/actors/pcDerived";
import type { WoundState } from "../../module/attacks/rules";
import { getWoundState } from "../../module/attacks/rules";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import {
  getActiveUnlocksOf,
  getVisibleSituationalModifiersOf,
  isGeneralAbilitySnapshot,
} from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { css, cx } from "../../styled-system/css";
import { badge } from "../../styled-system/recipes";
import { Translate } from "../Translate";
import { SituationalModifierBadge } from "./SituationalModifierBadge";

const woundStateLabels: Record<Exclude<WoundState, "ok">, string> = {
  hurt: "WoundStateHurt",
  seriouslyWounded: "WoundStateSeriouslyWounded",
  dead: "WoundStateDead",
};

interface UnlockBadgesProps {
  /** The live ability: the badges read it (and its actor) through snapshots */
  ability: AbilityItem;
  className?: string;
}

/**
 * Badges for an ability: boost, push pool, wound and Stability states, rating
 * cap, unlocks and situational modifiers. Shown on the ability's sheet and on
 * character sheets' ability rows, so it reads its own snapshots, and only
 * re-renders when one of its badges changes.
 */
export const AbilityBadges = memo(function AbilityBadges({
  ability: item,
  className,
}: UnlockBadgesProps) {
  // only what the badges show
  const ability = useItemSelector(item, (snapshot: AbilitySnapshot) => ({
    _id: snapshot._id,
    name: snapshot.name,
    pool: snapshot.system.pool,
    boost: snapshot.system.boost,
    isPushPool:
      isGeneralAbilitySnapshot(snapshot) && snapshot.system.isPushPool,
    unlocks: getActiveUnlocksOf(snapshot.system),
    situationalModifiers: getVisibleSituationalModifiersOf(snapshot.system),
  }));
  const useWoundStatusEffects = useSettings((s) => s.useWoundStatusEffects);
  const { situationalModifiers, unlocks } = ability;
  const activeModifiers = useActiveSituationalModifiers(item.uuid ?? "");
  // a PC's adaptations and Sanity's cap
  const { cap: ratingCap, reasons: ratingCapReasons } = useRatingCap(item);
  // the PC's Stability state, if this is their Stability, and whether this is
  // the actor's Health
  const fromActor = useActorAndSettings(item.actor, (actor, settings) => ({
    stabilityState:
      actor?.type === c.pc &&
      getStabilityAbilityIn(actor.items, settings)?._id === ability._id
        ? getStabilityStateIn(actor, settings)
        : null,
    isHealth:
      actor !== null && findHealthAbilityIn(actor.items)?._id === ability._id,
  }));
  const { stabilityState } = fromActor;
  const stabilityStateName = useStabilityStateName(stabilityState);
  // the owner's wound state, if this is their Health and the statuses are in
  // use. From the pool, so it's right even if a status is toggled by hand.
  const woundState =
    useWoundStatusEffects && fromActor.isHealth
      ? getWoundState(ability.pool)
      : null;
  // the badge's look is on a wrapper: Translate sets its own background
  const spaced = css({ marginInline: "0.24em" });
  return (
    <div
      className={cx(
        css({
          display: "flex",
          flexDirection: "row",
          justifyContent: "end",
          flexWrap: "wrap",
          gap: "0.1em",
        }),
        unlocks.length > 0 && css({ marginBottom: "0.25em" }),
        className,
      )}
    >
      {/* Boost */}
      {ability.boost && (
        <span className={cx(badge(), spaced)}>
          <Translate>Boosted</Translate>
        </span>
      )}

      {/* Push pool */}
      {ability.isPushPool && (
        <span className={cx(badge(), spaced)}>
          <Translate>Push Pool</Translate>
        </span>
      )}

      {/* Hurt, Seriously Wounded or Dead */}
      {woundState !== null && woundState !== "ok" && (
        <span
          data-testid="wound-state-badge"
          className={cx(badge({ tone: "danger", weight: "strong" }), spaced)}
        >
          <Translate>{woundStateLabels[woundState]}</Translate>
        </span>
      )}

      {/* Shaken, Shattered or Gone */}
      {stabilityState !== null && stabilityState !== "steady" && (
        <span
          data-testid="stability-state-badge"
          className={cx(badge({ tone: "danger", weight: "strong" }), spaced)}
        >
          {stabilityStateName}
        </span>
      )}

      {/* Adapted to Violence, or Sanity's cap */}
      {ratingCap !== null && (
        <span data-testid="rating-cap-badge" className={cx(badge(), spaced)}>
          <Translate
            values={{ Cap: String(ratingCap) }}
            title={ratingCapReasons.join("; ")}
          >
            CappedAtCap
          </Translate>
        </span>
      )}

      {/* Unlocks */}
      {unlocks.map<ReactNode>(({ description }, i) => {
        return (
          <span key={i} className={cx(badge({ weight: "strong" }), spaced)}>
            {description}
          </span>
        );
      })}

      {situationalModifiers.map<ReactNode>((situationalModifer) => {
        return (
          <SituationalModifierBadge
            key={situationalModifer.id}
            situationalModifier={situationalModifer}
            isActive={activeModifiers.includes(situationalModifer.id)}
            ability={item}
          />
        );
      })}
    </div>
  );
});
