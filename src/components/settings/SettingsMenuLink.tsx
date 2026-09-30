import { type AnyStep, Link } from "@lumphammer/minirouter";
import type { ReactNode } from "react";
import { useContext } from "react";
import { FaChevronRight } from "react-icons/fa6";

import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";

type SettingsMenuLinkProps = {
  to: AnyStep;
  label: string;
  icon: ReactNode;
};

/**
 * A full-width row in the settings menu which slides in a settings page.
 */
export const SettingsMenuLink = ({
  to,
  label,
  icon,
}: SettingsMenuLinkProps) => {
  const theme = useContext(ThemeContext);

  return (
    <Link
      to={to}
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "0.75em",
        padding: "0.75em 1em",
        borderBottom: `1px solid ${theme.colors.controlBorder}`,
        font: theme.displayFont,
        fontSize: "1.2em",
        textShadow: "none",
        "&:hover, &:focus-visible": {
          backgroundColor: theme.colors.bgOpaquePrimary,
          textShadow: "none",
        },
      }}
    >
      <span css={{ width: "1.2em", textAlign: "center", opacity: 0.8 }}>
        {icon}
      </span>
      <span
        css={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <Translate>{label}</Translate>
      </span>
      <FaChevronRight css={{ opacity: 0.6 }} />
    </Link>
  );
};

SettingsMenuLink.displayName = "SettingsMenuLink";
