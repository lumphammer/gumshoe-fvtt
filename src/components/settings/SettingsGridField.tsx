import type { ComponentProps } from "react";

import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { row } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";

/**
 * A row in a settings `InputGrid`. Each row is a subgrid spanning the whole
 * grid, so the alternating tint covers both the label and the control, and the
 * label can be centred against the control. Rows are striped by position, so
 * conditionally rendered rows don't break the pattern (this relies on rows
 * being the only `div`s directly inside the grid): the catalogue's
 * `row({ striped: true })`.
 */
type SettingsGridFieldProps = ComponentProps<typeof GridField>;

export const SettingsGridField = ({
  labelClassName,
  ...props
}: SettingsGridFieldProps) => {
  return (
    <div
      className={cx(
        row({ striped: true }),
        css({
          gridColumn: "label / end",
          padding: "0.5em",
          display: "grid",
          gridTemplateColumns: "subgrid",
          alignItems: "center",
        }),
      )}
    >
      <GridField
        {...props}
        labelClassName={cx(
          css({ alignSelf: "center", paddingTop: 0 }),
          labelClassName,
        )}
      />
    </div>
  );
};

SettingsGridField.displayName = "SettingsGridField";

type SettingsGridFieldStackedProps = ComponentProps<typeof GridFieldStacked>;

export const SettingsGridFieldStacked = (
  props: SettingsGridFieldStackedProps,
) => {
  return (
    <div
      className={cx(
        row({ striped: true }),
        css({ gridColumn: "label / end", padding: "0.5em" }),
      )}
    >
      <GridFieldStacked {...props} />
    </div>
  );
};

SettingsGridFieldStacked.displayName = "SettingsGridFieldStacked";
