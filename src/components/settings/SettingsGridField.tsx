import type { ComponentProps } from "react";
import { useContext } from "react";

import { ThemeContext } from "../../themes/ThemeContext";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";

/**
 * A row in a settings `InputGrid`. Each row is a subgrid spanning the whole
 * grid, so the alternating tint covers both the label and the control, and the
 * label can be centred against the control. Rows are striped by position, so
 * conditionally rendered rows don't break the pattern (this relies on rows
 * being the only `div`s directly inside the grid).
 */
const useRowStyle = () => {
  const theme = useContext(ThemeContext);
  return {
    gridColumn: "label / end",
    padding: "0.5em",
    "&:nth-of-type(odd)": {
      background: theme.colors.backgroundSecondary,
    },
  };
};

type SettingsGridFieldProps = ComponentProps<typeof GridField>;

export const SettingsGridField = ({
  labelStyle,
  ...props
}: SettingsGridFieldProps) => {
  const rowStyle = useRowStyle();
  return (
    <div
      css={{
        ...rowStyle,
        display: "grid",
        gridTemplateColumns: "subgrid",
        alignItems: "center",
      }}
    >
      <GridField
        {...props}
        labelStyle={{ alignSelf: "center", paddingTop: 0, ...labelStyle }}
      />
    </div>
  );
};

SettingsGridField.displayName = "SettingsGridField";

type SettingsGridFieldStackedProps = ComponentProps<typeof GridFieldStacked>;

export const SettingsGridFieldStacked = (
  props: SettingsGridFieldStackedProps,
) => {
  const rowStyle = useRowStyle();
  return (
    <div css={rowStyle}>
      <GridFieldStacked {...props} />
    </div>
  );
};

SettingsGridFieldStacked.displayName = "SettingsGridFieldStacked";
