import { useCallback, useContext } from "react";

import { absoluteCover } from "../../absoluteCover";
import { SettingsGridField } from "../SettingsGridField";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
// import { store } from "../store";
import type { Setters } from "../types";
import { Categories } from "./Categories";

interface CardsSettingsProps {
  setters: Setters;
}

export const CardsSettings = ({ setters }: CardsSettingsProps) => {
  const { settings } = useContext(StateContext);

  const handleChangeUseCards = useCallback(
    (checked: boolean) => {
      setters.useCards(checked);
    },
    [setters],
  );

  return (
    <div
      data-testid="cards-settings"
      css={{
        ...absoluteCover,
        display: "flex",
        flexDirection: "column",
        padding: "0.5em",
      }}
    >
      <div>
        <InputGrid css={{}}>
          <SettingsGridField label="Use cards?">
            <Toggle
              checked={settings.useCards}
              onChange={handleChangeUseCards}
            />
          </SettingsGridField>
        </InputGrid>
      </div>
      {settings.useCards && (
        <>
          <div css={{ flex: 1, position: "relative" }}>
            <Categories />
          </div>
        </>
      )}
      {/* <DevTools /> */}
    </div>
  );
};

CardsSettings.displayName = "CardsSettings";
