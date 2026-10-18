import type { ReactNode } from "react";
import { useContext } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { assertAbilityItem } from "../../module/items/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import { stabilityStateLabels } from "../../module/stability/states";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";
import { SituationalModifierBadge } from "./SituationalModifierBadge";

interface UnlockBadgesProps {
  ability: InvestigatorItem;
  className?: string;
}

export const AbilityBadges = ({ ability, className }: UnlockBadgesProps) => {
  assertAbilityItem(ability);
  const situationalModifiers = ability.system.getVisibleSituationalModifiers();
  const unlocks = ability.system.getActiveUnlocks();
  const ratingCap = ability.system.getRatingCap();
  const stabilityState = ability.system.getStabilityState();
  const theme = useContext(ThemeContext);
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
      {ability.system.boost && (
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
      {isGeneralAbilityItem(ability) && ability.system.isPushPool && (
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

      {/* Shaken, Shattered or Gone */}
      {stabilityState !== null && stabilityState !== "steady" && (
        // styled on a wrapper: Translate sets its own background
        <span
          data-testid="stability-state-badge"
          css={{
            background: theme.colors.danger,
            color: theme.colors.accentContrast,
            fontSize: "0.9em",
            lineHeight: "1",
            borderRadius: "0.5em",
            padding: "0 0.5em",
            margin: "0 0.24em",
          }}
        >
          <Translate>{stabilityStateLabels[stabilityState]}</Translate>
        </span>
      )}

      {/* Adapted to Violence */}
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
            title={getTranslated("Adapted to Violence")}
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
            ability={ability}
          />
        );
      })}
    </div>
  );
};

AbilityBadges.displayName = "AbilityBadges";
