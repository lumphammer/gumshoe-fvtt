import { memo, useCallback } from "react";

import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilityItem } from "../../module/items/exports";
import { Button } from "../inputs/Button";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { inputGridStyle } from "../inputs/InputGrid";
import { Translate } from "../Translate";
import { Panel } from "../Panel";

export const PushPoolButton = memo(function PushPoolButton({
  item,
}: {
  /** Only to write through */
  item: AbilityItem;
}) {
  const { push } = useSystemMethods(item);

  const handleClickPush = useCallback(() => {
    void push();
  }, [push]);

  return (
    <Panel css={{ ...inputGridStyle, marginBottom: "0.5em" }}>
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
    </Panel>
  );
});
