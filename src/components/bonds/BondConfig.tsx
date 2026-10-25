import type { ReactNode } from "react";

import { confirmAndDeleteItem } from "../../functions/confirmAndDeleteItem";
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

  return (
    <InputGrid>
      {children}
      <GridFieldStacked label="Delete">
        <Button onClick={() => void confirmAndDeleteItem(item)}>
          <Translate>Delete Item</Translate>
        </Button>
      </GridFieldStacked>
    </InputGrid>
  );
};

BondConfig.displayName = "BondConfig";
