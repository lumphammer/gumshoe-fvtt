import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertNetworkContactItem } from "../../module/items/networkContact";
import { BondConfig } from "../bonds/BondConfig";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { GridField } from "../inputs/GridField";

/**
 * The contact's settings: fixing the pool by hand (without touching Network),
 * and deleting the contact
 */
export const NetworkContactConfig = () => {
  const { item } = useItemSheetContext();
  assertNetworkContactItem(item);

  return (
    <BondConfig>
      <GridField label="Manually adjust pool">
        <AsyncNumberInput
          value={item.system.pool}
          onChange={item.system.setPool}
          min={0}
        />
      </GridField>
    </BondConfig>
  );
};

NetworkContactConfig.displayName = "NetworkContactConfig";
