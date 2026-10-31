import type { ReactNode } from "react";
import { memo, useContext } from "react";

import * as c from "../../constants";
import { useActiveSituationalModifiers } from "../../hooks/useActiveSituationalModifiers";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import {
  findHealthAbilityIn,
  getRatingCapsIn,
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
import { getStabilityStateName } from "../../module/stability/settings";
import { ThemeContext } from "../../themes/ThemeContext";
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
  const settings = useSettings((s) => s);
  const { situationalModifiers, unlocks } = ability;
  const activeModifiers = useActiveSituationalModifiers(item.uuid ?? "");
  const theme = useContext(ThemeContext);
  // a PC's adaptations and Sanity's cap, Stability and Health
  const fromActor = useActorSnapshot(item.actor, (actor) => {
    const isPC = actor?.type === c.pc;
    const caps =
      actor && isPC ? getRatingCapsIn(actor, ability.name, settings) : [];
    return {
      ratingCap:
        caps.length > 0 ? Math.min(...caps.map(({ cap }) => cap)) : null,
      ratingCapReasons: caps.map(({ reason }) => reason),
      stabilityState:
        actor &&
        isPC &&
        getStabilityAbilityIn(actor.items, settings)?._id === ability._id
          ? getStabilityStateIn(actor, settings)
          : null,
      isHealth:
        actor !== null && findHealthAbilityIn(actor.items)?._id === ability._id,
    };
  });
  const { ratingCap, stabilityState } = fromActor;
  // the owner's wound state, if this is their Health and the statuses are in
  // use. From the pool, so it's right even if a status is toggled by hand.
  const woundState =
    settings.useWoundStatusEffects && fromActor.isHealth
      ? getWoundState(ability.pool)
      : null;
  // styled on a wrapper: Translate sets its own background
  const stateBadgeStyle = {
    background: theme.colors.danger,
    color: theme.colors.accentContrast,
    fontSize: "0.9em",
    lineHeight: "1",
    borderRadius: "0.5em",
    padding: "0 0.5em",
    margin: "0 0.24em",
  };
  return (
    <div
      className={className}
      css={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "end",
        flexWrap: "wrap",
        gap: "0.1em",
        marginBottom: unlocks.length > 0 ? "0.25em" : undefined,
      }}
    >
      {/* Boost */}
      {ability.boost && (
        <Translate
          css={{
            background: theme.colors.accentContrast,
            color: theme.colors.accent,
            outline: `1px solid ${theme.colors.accent}`,
            fontSize: "0.9em",
            lineHeight: "1",
            borderRadius: "0.5em",
            padding: "0 0.5em",
            margin: "0 0.24em",
          }}
        >
          Boosted
        </Translate>
      )}

      {/* Push pool */}
      {ability.isPushPool && (
        <Translate
          css={{
            background: theme.colors.accentContrast,
            color: theme.colors.accent,
            outline: `1px solid ${theme.colors.accent}`,
            fontSize: "0.9em",
            lineHeight: "1",
            borderRadius: "0.5em",
            padding: "0 0.5em",
            margin: "0 0.24em",
          }}
        >
          Push Pool
        </Translate>
      )}

      {/* Hurt, Seriously Wounded or Dead */}
      {woundState !== null && woundState !== "ok" && (
        <span data-testid="wound-state-badge" css={stateBadgeStyle}>
          <Translate>{woundStateLabels[woundState]}</Translate>
        </span>
      )}

      {/* Shaken, Shattered or Gone */}
      {stabilityState !== null && stabilityState !== "steady" && (
        <span data-testid="stability-state-badge" css={stateBadgeStyle}>
          {getStabilityStateName(stabilityState, settings)}
        </span>
      )}

      {/* Adapted to Violence, or Sanity's cap */}
      {ratingCap !== null && (
        // styled on a wrapper: Translate sets its own background
        <span
          data-testid="rating-cap-badge"
          css={{
            background: theme.colors.accentContrast,
            color: theme.colors.accent,
            outline: `1px solid ${theme.colors.accent}`,
            fontSize: "0.9em",
            lineHeight: "1",
            borderRadius: "0.5em",
            padding: "0 0.5em",
            margin: "0 0.24em",
          }}
        >
          <Translate
            values={{ Cap: String(ratingCap) }}
            title={fromActor.ratingCapReasons.join("; ")}
          >
            CappedAtCap
          </Translate>
        </span>
      )}

      {/* Unlocks */}
      {unlocks.map<ReactNode>(({ description }, i) => {
        return (
          <span
            key={i}
            css={{
              background: theme.colors.accent,
              color: theme.colors.accentContrast,
              fontSize: "0.9em",
              lineHeight: "1",
              borderRadius: "0.5em",
              padding: "0 0.5em",
              margin: "0 0.2em",
            }}
          >
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
