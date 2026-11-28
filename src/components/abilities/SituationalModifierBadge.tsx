import { memo } from "react";

import type { AbilityItem } from "../../module/items/exports";
import type { DeepReadonly } from "../../module/snapshots/createSnapshotStore";
import { css, cx } from "../../styled-system/css";
import { badge } from "../../styled-system/recipes";
import type { SituationalModifier } from "../../types";
import { clickable } from "../clickable";

interface SituationalModifierBadgeProps {
  situationalModifier: DeepReadonly<SituationalModifier>;
  isActive: boolean;
  /** Only to toggle the modifier */
  ability: AbilityItem;
  /** `sm` in a dense list (an ability's row) */
  size?: "sm" | "md";
}

/** A situational modifier, as a badge that toggles it. Active is pressed. */
export const SituationalModifierBadge = memo(function SituationalModifierBadge({
  situationalModifier: { situation, modifier, id },
  isActive,
  ability,
  size,
}: SituationalModifierBadgeProps) {
  const toggle = () => {
    ability.system.toggleSituationalModifier(id);
  };
  return (
    <a
      {...clickable(toggle)}
      aria-pressed={isActive}
      data-interactive
      className={cx(badge({ size }), css({ marginInline: "0.25em" }))}
    >
      {situation}: {modifier >= 0 && "+"}
      {modifier}
      {/* aria-pressed says it already */}
      <span
        aria-hidden="true"
        className={css({
          display: "inline-block",
          paddingLeft: "0.25em",
          width: "1em",
          fontWeight: "bold",
        })}
      >
        {isActive ? "✓" : "✗"}
      </span>
    </a>
  );
});
