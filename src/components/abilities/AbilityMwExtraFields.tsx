import { memo } from "react";

import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilityItem } from "../../module/items/exports";
import type { GeneralAbilityItem } from "../../module/items/generalAbility";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";

interface AbilityMwExtraFieldsProps {
  /** Only to write through (a general ability, in Moribund World) */
  item: AbilityItem;
  trumps: string;
  trumpedBy: string;
}

export const AbilityMwExtraFields = memo(function AbilityMwExtraFields({
  item,
  trumps,
  trumpedBy,
}: AbilityMwExtraFieldsProps) {
  const { setMwTrumps, setMwTrumpedBy } = useSystemMethods(
    item as GeneralAbilityItem,
  );

  return (
    <InputGrid
      css={{
        paddingTop: "0.5em",
      }}
    >
      <GridField label="Trumps">
        <AsyncTextInput value={trumps} onChange={setMwTrumps} />
      </GridField>
      <GridField label="Trumped by">
        <AsyncTextInput value={trumpedBy} onChange={setMwTrumpedBy} />
      </GridField>
    </InputGrid>
  );
});
