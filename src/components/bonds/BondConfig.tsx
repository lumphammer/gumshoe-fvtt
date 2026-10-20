import type { ReactNode } from "react";
import { useCallback } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { Button } from "../inputs/Button";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";

/**
 * A Delete button, after any `children` (more fields for the same grid). It
 * suits contacts as well as Bonds.
 */
export const BondConfig = ({ children }: { children?: ReactNode }) => {
  const { item } = useItemSheetContext();
  const onClickDelete = useCallback(async () => {
    const message = item.actor
      ? "DeleteActorNamesEquipmentName"
      : "DeleteEquipmentName";

    const aye = await confirmADoodleDo({
      message,
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      values: {
        ActorName: item.actor?.name ?? "",
        EquipmentName: item.name ?? "",
      },
      resolveFalseOnCancel: true,
    });
    if (aye) {
      await item.delete();
    }
  }, [item]);

  return (
    <InputGrid>
      {children}
      <GridFieldStacked label="Delete">
        <Button onClick={onClickDelete}>
          <Translate>Delete Item</Translate>
        </Button>
      </GridFieldStacked>
    </InputGrid>
  );
};

BondConfig.displayName = "BondConfig";
