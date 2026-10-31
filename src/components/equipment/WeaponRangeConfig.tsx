import { memo } from "react";

import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { GridField } from "../inputs/GridField";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";

// the toggle, then damage, then (if shown) spend, lined up down the rows
const toggleColumnWidth = "2.5em";

const getColumns = (showSpend: boolean) =>
  showSpend
    ? `${toggleColumnWidth} minmax(0, 1fr) minmax(0, 1fr)`
    : `${toggleColumnWidth} minmax(0, 1fr)`;

/** Column headings for the ranges, when they have spends as well as damage */
export const WeaponRangeHeadings = () => {
  return (
    <GridField noLabel>
      <div
        css={{
          display: "grid",
          gridTemplateColumns: getColumns(true),
          gap: "0.5em",
          fontSize: "0.85em",
          opacity: 0.8,
        }}
      >
        <span />
        <Translate>Damage</Translate>
        <Translate>Spend</Translate>
      </div>
    </GridField>
  );
};

type WeaponRangeProps = {
  label: string;
  damage: number;
  enabled: boolean;
  setDamage: (value: number) => void;
  setEnabled: (enabled: boolean) => void;
  /** leave out to hide the spend */
  spend?: number;
  setSpend?: (value: number) => void;
};

export const WeaponRange = memo(function WeaponRange({
  label,
  damage,
  enabled,
  setDamage,
  setEnabled,
  spend,
  setSpend,
}: WeaponRangeProps) {
  const showSpend = spend !== undefined && setSpend !== undefined;
  return (
    <GridField label={label}>
      <div
        css={{
          display: "grid",
          gridTemplateColumns: getColumns(showSpend),
          gap: "0.5em",
          alignItems: "center",
        }}
      >
        <Toggle checked={enabled} onChange={setEnabled} />
        <AsyncNumberInput
          disabled={!enabled}
          value={damage}
          onChange={setDamage}
        />
        {showSpend && (
          <AsyncNumberInput
            // a spend of 0 is the usual case, so it shouldn't stand out (fade
            // the number only: faded buttons look disabled)
            css={spend === 0 ? { input: { opacity: 0.6 } } : undefined}
            disabled={!enabled}
            min={0}
            integer
            value={spend}
            onChange={setSpend}
          />
        )}
      </div>
    </GridField>
  );
});
