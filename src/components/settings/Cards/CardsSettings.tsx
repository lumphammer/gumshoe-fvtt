import { useContext } from "react";

import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";
import { Categories } from "./Categories";

interface CardsSettingsProps {
  setters: Setters;
}

export const CardsSettings = ({ setters }: CardsSettingsProps) => {
  const { settings } = useContext(StateContext);

  return (
    <div
      data-testid="cards-settings"
      css={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <InputGrid>
        <SettingsGridField label="Use cards?">
          <Toggle checked={settings.useCards} onChange={setters.useCards} />
        </SettingsGridField>
      </InputGrid>
      {settings.useCards && (
        <>
          <h3>
            <Translate>Card categories</Translate>
          </h3>
          <Categories css={{ flex: 1, minHeight: "10em" }} />
        </>
      )}
    </div>
  );
};

CardsSettings.displayName = "CardsSettings";
