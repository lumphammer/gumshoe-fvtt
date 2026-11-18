import { type AnyStep, Link } from "@lumphammer/minirouter";
import type { ReactNode } from "react";
import { FaChevronRight } from "react-icons/fa6";

import { Translate } from "../Translate";
import { displayText, mutedText, row } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";

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
  return (
    <Link
      to={to}
      className={cx(
        row({ interactive: true, divided: true }),
        css({
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.75em",
          padding: "0.6em 1em",
          "&:hover .chevron, &:focus-visible .chevron": {
            transform: "translateX(0.2em)",
          },
        }),
      )}
    >
      {icon && (
        <span
          className={css({
            width: "1.2em",
            textAlign: "center",
            opacity: 0.8,
            fontSize: "1.2em",
          })}
        >
          {icon}
        </span>
      )}
      <span className={css({ flex: "[1]", minWidth: 0 })}>
        <span
          className={cx(
            displayText(),
            css({
              display: "block",
              fontSize: "1.2em",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }),
          )}
        >
          <Translate>{label}</Translate>
        </span>
        {description && (
          <span
            className={cx(mutedText({ size: "sm" }), css({ display: "block" }))}
          >
            <Translate>{description}</Translate>
          </span>
        )}
      </span>
      {summary !== undefined && summary !== null && (
        <span
          className={cx(
            mutedText(),
            css({
              flex: "[0 1 auto]",
              maxWidth: "40%",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }),
          )}
        >
          {summary}
        </span>
      )}
      <FaChevronRight
        className={cx(
          "chevron",
          css({ opacity: 0.6, transition: "[transform 100ms ease-out]" }),
        )}
      />
    </Link>
  );
};

SettingsMenuLink.displayName = "SettingsMenuLink";
