import { useCallback, useContext } from "react";

import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertAbilityItem } from "../../module/items/exports";
import { ThemeContext } from "../../themes/ThemeContext";
import { Button } from "../inputs/Button";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";

export const PushPoolButton = () => {
  const { item } = useItemSheetContext();
  const theme = useContext(ThemeContext);
  assertAbilityItem(item);

  const handleClickPush = useCallback(() => {
    void item.system.push();
  }, [item]);

  return (
    <InputGrid
      className={theme.panelClass}
      css={{
        padding: "0.5em",
        marginBottom: "0.5em",
        ...theme.panelStyleSecondary,
      }}
    >
      <GridFieldStacked>
        <div
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Button css={{ flex: 1 }} onClick={handleClickPush}>
            <Translate>Push</Translate>
          </Button>
        </div>
      </GridFieldStacked>
    </InputGrid>
  );
};

PushPoolButton.displayName = "PushPoolButton";
