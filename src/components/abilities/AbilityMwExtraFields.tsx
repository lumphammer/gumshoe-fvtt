import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertGeneralAbilityItem } from "../../module/items/generalAbility";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";

export const AbilityMwExtraFields = () => {
  const { item } = useItemSheetContext();
  assertGeneralAbilityItem(item);

  return (
    <InputGrid
      css={{
        paddingTop: "0.5em",
      }}
    >
      <GridField label="Trumps">
        <AsyncTextInput
          value={item.system.mwTrumps}
          onChange={item.system.setMwTrumps}
        />
      </GridField>
      <GridField label="Trumped by">
        <AsyncTextInput
          value={item.system.mwTrumpedBy}
          onChange={item.system.setMwTrumpedBy}
        />
      </GridField>
    </InputGrid>
  );
};
