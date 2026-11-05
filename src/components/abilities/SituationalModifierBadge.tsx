import { memo } from "react";

import type { AbilityItem } from "../../module/items/exports";
import type { DeepReadonly } from "../../module/snapshots/createSnapshotStore";
import { css, cx } from "../../styled-system/css";
import { badge } from "../../styled-system/recipes";
import type { SituationalModifier } from "../../types";

interface SituationalModifierBadgeProps {
  situationalModifier: DeepReadonly<SituationalModifier>;
  isActive: boolean;
  /** Only to toggle the modifier */
  ability: AbilityItem;
}

/** A situational modifier, as a badge that toggles it. Active is pressed. */
export const SituationalModifierBadge = memo(function SituationalModifierBadge({
  situationalModifier: { situation, modifier, id },
  isActive,
  ability,
}: SituationalModifierBadgeProps) {
  return (
    <a
      role="button"
      aria-pressed={isActive}
      data-interactive
      onClick={() => {
        ability.system.toggleSituationalModifier(id);
      }}
      className={cx(badge(), css({ marginInline: "0.25em" }))}
    >
      {situation}: {modifier >= 0 && "+"}
      {modifier}
      <span
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
