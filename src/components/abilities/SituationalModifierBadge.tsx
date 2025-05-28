import { useContext } from "react";

import { AbilityItem } from "../../module/items/exports";
import { ThemeContext } from "../../themes/ThemeContext";
import { SituationalModifier } from "../../types";

interface SituationalModifierBadgeProps {
  situationalModifier: SituationalModifier;
  ability: AbilityItem;
}

export const SituationalModifierBadge = ({
  situationalModifier: { situation, modifier, id },
  ability,
}: SituationalModifierBadgeProps) => {
  const theme = useContext(ThemeContext);
  const isActive = ability.system.isSituationalModifierActive(id);
  return (
    <a
      onClick={() => {
        ability.system.toggleSituationalModifier(id);
      }}
      css={{
        display: "inline-block",
        position: "relative",
        background: theme.colors.accentContrast,
        color: theme.colors.accent,
        border: `1px solid ${theme.colors.accent}`,
        fontSize: "0.9em",
        lineHeight: "1",
        borderRadius: "0.5em",
        padding: "0 0.5em",
        margin: "0 0.25em",
        boxShadow: isActive ? `0 0 0.7em 0.2em ${theme.colors.glow}` : "none",
        opacity: isActive ? 1 : 0.5,
      }}
    >
      <span
        css={{
          display: "inline-block",
          position: "relative",
        }}
      >
        {situation}: {modifier >= 0 && "+"}
        {modifier}
      </span>
      <span
        css={{
          display: "inline-block",
          position: "relative",
          paddingLeft: "0.25em",
          width: "1em",
          fontWeight: "bold",
        }}
      >
        {isActive ? "✓" : "✗"}
      </span>
    </a>
  );
};

SituationalModifierBadge.displayName = "SituationalModifierBadge";
