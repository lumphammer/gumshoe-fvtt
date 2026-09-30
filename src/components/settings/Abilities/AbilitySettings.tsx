import { SettingsMenuLink } from "../SettingsMenuLink";
import { abilityPages } from "./abilityPages";

export const AbilitySettings = () => {
  return (
    <nav>
      {abilityPages.map(({ direction, label }) => (
        <SettingsMenuLink key={label} to={direction()} label={label} />
      ))}
    </nav>
  );
};

AbilitySettings.displayName = "AbilitySettings";
