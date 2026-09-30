import { type AnyStep, Link } from "@lumphammer/minirouter";
import type { ReactNode } from "react";
import { useContext } from "react";
import { FaChevronRight } from "react-icons/fa6";

import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";
import { useListHoverBg } from "./useListHoverBg";

type SettingsMenuLinkProps = {
  to: AnyStep;
  label: string;
  /** translation key for a line explaining what's on the page */
  description?: string;
  /** a glance at the current value(s), shown at the end of the row */
  summary?: ReactNode;
  icon?: ReactNode;
};

/**
 * A full-width row in the settings menu which slides in a settings page.
 */
export const SettingsMenuLink = ({
  to,
  label,
  description,
  summary,
  icon,
}: SettingsMenuLinkProps) => {
  const theme = useContext(ThemeContext);
  const hoverBg = useListHoverBg();

  return (
    <Link
      to={to}
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "0.75em",
        padding: "0.6em 1em",
        borderBottom: `1px solid ${theme.colors.controlBorder}`,
        textShadow: "none",
        "&:hover, &:focus-visible": {
          backgroundColor: hoverBg,
          textShadow: "none",
        },
        "&:hover .chevron, &:focus-visible .chevron": {
          transform: "translateX(0.2em)",
        },
      }}
    >
      {icon && (
        <span
          css={{
            width: "1.2em",
            textAlign: "center",
            opacity: 0.8,
            fontSize: "1.2em",
          }}
        >
          {icon}
        </span>
      )}
      <span css={{ flex: 1, minWidth: 0 }}>
        <span
          css={{
            display: "block",
            font: theme.displayFont,
            fontSize: "1.2em",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <Translate>{label}</Translate>
        </span>
        {description && (
          <span
            css={{
              display: "block",
              fontSize: "0.9em",
              color: theme.colors.text,
              opacity: 0.75,
            }}
          >
            <Translate>{description}</Translate>
          </span>
        )}
      </span>
      {summary !== undefined && summary !== null && (
        <span
          css={{
            flex: "0 1 auto",
            maxWidth: "40%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            color: theme.colors.text,
            opacity: 0.75,
          }}
        >
          {summary}
        </span>
      )}
      <FaChevronRight
        className="chevron"
        css={{ opacity: 0.6, transition: "transform 100ms ease-out" }}
      />
    </Link>
  );
};

SettingsMenuLink.displayName = "SettingsMenuLink";
