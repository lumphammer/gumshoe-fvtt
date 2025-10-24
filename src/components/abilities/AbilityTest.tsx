import { useCallback, useContext, useState } from "react";

import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertAbilityItem } from "../../module/items/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import { ThemeContext } from "../../themes/ThemeContext";
import { Button } from "../inputs/Button";
import { CheckButtons } from "../inputs/CheckButtons";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";

const defaultSpendOptions = Array.from({ length: 8 }, (_, i) => {
  const label = i.toString();
  return { label, value: Number(label), enabled: true };
});

export const AbilityTest = () => {
  const { item } = useItemSheetContext();
  assertAbilityItem(item);
  const theme = useContext(ThemeContext);
  const [spend, setSpend] = useState(0);

  const handleClickTest = useCallback(() => {
    void item.system.testAbility(spend);
    setSpend(0);
  }, [item, spend]);

  const handleClickSpend = useCallback(() => {
    void item.system.spendAbility(spend);
    setSpend(0);
  }, [item, spend]);

  const spendOptions = defaultSpendOptions.map((option) => {
    assertAbilityItem(item);
    return {
      ...option,
      enabled: option.value <= item.system.pool,
    };
  });

  const isGeneral = isGeneralAbilityItem(item);

  return (
    <InputGrid
      className={theme.panelClass}
      css={{
        padding: "0.5em",
        marginBottom: "0.5em",
        ...theme.panelStyleSecondary,
      }}
    >
      <GridField label="Spend">
        <CheckButtons
          onChange={setSpend}
          selected={spend}
          options={spendOptions}
        />
      </GridField>
      <GridFieldStacked>
        <div
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Button
            css={{ flex: 1 }}
            disabled={spend === 0}
            onClick={handleClickSpend}
          >
            <Translate>{isGeneral ? "Simple Spend" : "Spend"}</Translate>
          </Button>
          {isGeneral && (
            <Button css={{ flex: 1 }} onClick={handleClickTest}>
              <Translate>Test</Translate> <i className="fa fa-dice" />
            </Button>
          )}
        </div>
      </GridFieldStacked>
    </InputGrid>
  );
};
