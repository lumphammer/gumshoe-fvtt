import type { ComponentProps } from "react";
import { useContext } from "react";

import { ThemeContext } from "../../themes/ThemeContext";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";

type SettingsGridFieldProps = ComponentProps<typeof GridField> & {
  index?: number;
};

export const SettingsGridField = ({
  index = 0,
  ...props
}: SettingsGridFieldProps) => {
  const tint = index % 2 === 0;
  const theme = useContext(ThemeContext);
  return (
    <GridField
      {...props}
      css={{
        padding: "0.5em",
        background: tint ? theme.colors.backgroundSecondary : "none",
      }}
    />
  );
};

SettingsGridField.displayName = "SettingsGridField";

export const SettingsGridFieldStacked = ({
  index = 0,
  ...props
}: SettingsGridFieldProps) => {
  const tint = index % 2 === 0;
  const theme = useContext(ThemeContext);
  return (
    <GridFieldStacked
      {...props}
      css={{
        padding: "0.5em",
        background: tint ? theme.colors.backgroundSecondary : "none",
      }}
    />
  );
};

SettingsGridFieldStacked.displayName = "SettingsGridFieldStacked";
