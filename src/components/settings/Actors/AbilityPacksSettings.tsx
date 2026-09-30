import { useContext, useId } from "react";

import { assertGame } from "../../../functions/isGame";
import { ThemeContext } from "../../../themes/ThemeContext";
import { IdContext } from "../../IdContext";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { StateContext } from "../contexts";
import type { Setters } from "../types";

type AbilityPacksSettingsProps = {
  which: "newPCPacks" | "newNPCPacks";
  setters: Setters;
};

/**
 * Pick which Item compendium packs get added to new PCs or NPCs.
 */
export const AbilityPacksSettings = ({
  which,
  setters,
}: AbilityPacksSettingsProps) => {
  assertGame(game);
  const { settings } = useContext(StateContext);
  const theme = useContext(ThemeContext);
  const selectedPacks = settings[which];
  const setSelectedPacks = setters[which];

  const packs = game.packs.filter((pack) => pack.metadata.type === "Item");
  const baseId = useId();

  return (
    <div>
      <p css={{ marginTop: 0 }}>
        <Translate>
          {which === "newPCPacks"
            ? "Items from these compendium packs are added to every new PC."
            : "Items from these compendium packs are added to every new NPC."}
        </Translate>
      </p>
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          columnGap: "0.5em",
        }}
      >
        {packs.map((pack, i) => {
          const id = `${baseId}-${pack.collection}`;
          return (
            <IdContext.Provider value={id} key={pack.collection}>
              <div
                css={{
                  gridColumn: "1 / -1",
                  display: "grid",
                  gridTemplateColumns: "subgrid",
                  alignItems: "center",
                  padding: "0.3em 0.5em",
                  background:
                    i % 2 === 0 ? theme.colors.backgroundButton : undefined,
                }}
              >
                <Toggle
                  checked={selectedPacks.includes(pack.collection)}
                  onChange={(checked) => {
                    setSelectedPacks(
                      checked
                        ? [...selectedPacks, pack.collection]
                        : selectedPacks.filter((x) => x !== pack.collection),
                    );
                  }}
                />
                <label htmlFor={id} title={pack.collection}>
                  {pack.metadata.label}
                </label>
              </div>
            </IdContext.Provider>
          );
        })}
      </div>
    </div>
  );
};

AbilityPacksSettings.displayName = "AbilityPacksSettings";
