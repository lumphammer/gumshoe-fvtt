import { Router } from "@lumphammer/minirouter";
import { SlideInOutlet } from "@lumphammer/minirouter/animated";
import { useCallback, useContext } from "react";

import { absoluteCover } from "../../absoluteCover";
import { GridField } from "../../inputs/GridField";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
// import { store } from "../store";
import { Setters } from "../types";
import { Categories } from "./Categories";

interface CardsSettingsProps {
  setters: Setters;
}

export const CardsSettings = ({ setters }: CardsSettingsProps) => {
  const { settings } = useContext(StateContext);

  const handleChangeUseCards = useCallback(
    (checked: boolean) => {
      // eslint-disable-next-line react-compiler/react-compiler
      setters.useCards(checked);
    },
    [setters],
  );

  return (
    <Router>
      <SlideInOutlet after>
        <div
          data-testid="cards-settings"
          css={{
            ...absoluteCover,
            display: "flex",
            flexDirection: "column",
            padding: "0.5em",
            pointerEvents: "auto",
          }}
        >
          <div>
            <InputGrid css={{}}>
              <GridField label="Use cards?">
                <Toggle
                  checked={settings.useCards}
                  onChange={handleChangeUseCards}
                />
              </GridField>
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
      </SlideInOutlet>
    </Router>
  );
};

CardsSettings.displayName = "CardsSettings";
