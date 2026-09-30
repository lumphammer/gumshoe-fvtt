import type { Direction } from "@lumphammer/minirouter";

import { SettingsMenuLink } from "./SettingsMenuLink";

type SettingsMenuProps = {
  pages: { direction: Direction; label: string }[];
};

/**
 * A menu of links to settings sub-pages.
 */
export const SettingsMenu = ({ pages }: SettingsMenuProps) => {
  return (
    <nav>
      {pages.map(({ direction, label }) => (
        <SettingsMenuLink key={label} to={direction()} label={label} />
      ))}
    </nav>
  );
};

SettingsMenu.displayName = "SettingsMenu";
