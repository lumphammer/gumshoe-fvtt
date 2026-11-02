import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { NetworkContactItem } from "../../module/items/networkContact";
import { BondConfig } from "../bonds/BondConfig";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { GridField } from "../inputs/GridField";

type NetworkContactConfigProps = {
  /** only to write through */
  item: NetworkContactItem;
  pool: number;
};

/**
 * The contact's settings: fixing the pool by hand (without touching Network),
 * and deleting the contact
 */
export const NetworkContactConfig = ({
  item,
  pool,
}: NetworkContactConfigProps) => {
  "use memo";

  const methods = useSystemMethods(item);
  return (
    <BondConfig item={item}>
      <GridField label="Manually adjust pool">
        <AsyncNumberInput value={pool} onChange={methods.setPool} min={0} />
      </GridField>
    </BondConfig>
  );
};

NetworkContactConfig.displayName = "NetworkContactConfig";
