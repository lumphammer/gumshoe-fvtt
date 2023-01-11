import React from "react";
import { AsyncCheckbox } from "../inputs/AsyncCheckbox";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { GridField } from "../inputs/GridField";

type WeaponRangeProps = {
  label: string;
  damage: number;
  enabled: boolean;
  setDamage: (value: number) => void;
  setEnabled: (enabled: boolean) => void;
};

export const WeaponRange: React.FC<WeaponRangeProps> = ({
  label,
  damage,
  enabled,
  setDamage,
  setEnabled,
}) => {
  return (
    <GridField label={label}>
      <div
        css={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <AsyncCheckbox checked={enabled} onChange={setEnabled} />
        <AsyncNumberInput
          css={{ flex: 1 }}
          disabled={!enabled}
          value={damage}
          onChange={setDamage}
        />
      </div>
    </GridField>
  );
};
