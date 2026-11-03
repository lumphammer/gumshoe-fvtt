import type { Direction } from "@lumphammer/minirouter";
import type { ReactNode } from "react";
import { useContext } from "react";

import type { SettingsDict } from "../../settings/settings";
import { StateContext } from "./contexts";
import { SettingsMenuLink } from "./SettingsMenuLink";

/**
 * A page in a settings menu.
 */
export type SettingsPageDef = {
  direction: Direction;
  label: string;
  /** translation key for a line explaining what's on the page */
  description?: string;
  /** a glance at the current value(s), from the unsaved settings */
  summary?: (settings: SettingsDict) => ReactNode;
  icon?: ReactNode;
};

type SettingsMenuProps = {
  pages: SettingsPageDef[];
  className?: string;
  "data-testid"?: string;
};

/**
 * A menu of links to settings pages.
 */
export const SettingsMenu = ({
  pages,
  className,
  "data-testid": testId,
}: SettingsMenuProps) => {
  const { settings } = useContext(StateContext);
  return (
    <nav className={className} data-testid={testId}>
      {pages.map(({ direction, label, description, summary, icon }) => (
        <SettingsMenuLink
          key={label}
          to={direction()}
          label={label}
          description={description}
          summary={summary?.(settings)}
          icon={icon}
        />
      ))}
    </nav>
  );
};

SettingsMenu.displayName = "SettingsMenu";
