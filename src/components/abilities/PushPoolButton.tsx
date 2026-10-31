import { memo, useCallback, useContext } from "react";

import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilityItem } from "../../module/items/exports";
import { ThemeContext } from "../../themes/ThemeContext";
import { Button } from "../inputs/Button";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";

export const PushPoolButton = memo(function PushPoolButton({
  item,
}: {
  /** Only to write through */
  item: AbilityItem;
}) {
  const theme = useContext(ThemeContext);
  const { push } = useSystemMethods(item);

  const handleClickPush = useCallback(() => {
    void push();
  }, [push]);

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
});
