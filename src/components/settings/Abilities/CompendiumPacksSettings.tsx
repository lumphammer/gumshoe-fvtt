import { nanoid } from "nanoid";
import { useContext } from "react";

import { assertGame } from "../../../functions/isGame";
import { ThemeContext } from "../../../themes/ThemeContext";
import { IdContext } from "../../IdContext";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { StateContext } from "../contexts";
import { SettingsGridFieldStacked } from "../SettingsGridField";
import type { Setters } from "../types";

export const CompendiumPacksSettings = ({ setters }: { setters: Setters }) => {
  assertGame(game);
  const { settings } = useContext(StateContext);
  const theme = useContext(ThemeContext);

  return (
    <InputGrid
      css={{
        flex: 1,
        overflow: "auto",
      }}
    >
      <SettingsGridFieldStacked
        label="Compendium packs for new characters"
        noLabel
      >
        <div
          css={{
            display: "grid",
            gridTemplateColumns: "max-content 1fr max-content",
            gridAutoRows: "min-content",
            columnGap: "0.5em",
            whiteSpace: "nowrap",
            ".header": {
              fontWeight: "bold",
            },
          }}
        >
          <div css={{ gridColumn: 1, gridRow: 1 }}>
            <label>
              {" "}
              <Translate>PCs</Translate>{" "}
            </label>
          </div>
          <div css={{ gridColumn: 3, gridRow: 1 }}>
            <label>
              {" "}
              <Translate>NPCs</Translate>{" "}
            </label>
          </div>
          {game.packs
            .filter((pack) => pack.metadata.type === "Item")
            .map((pack, i) => {
              const pcSelected = settings.newPCPacks.includes(pack.collection);
              const npcSelected = settings.newNPCPacks.includes(
                pack.collection,
              );
              const id = nanoid();
              const gridRow = i + 2;
              return (
                <IdContext.Provider value={id} key={pack.metadata.name}>
                  {gridRow % 2 === 0 && (
                    <div
                      css={{
                        gridRow,
                        gridColumn: "1/4",
                        background: theme.colors.backgroundButton,
                      }}
                    />
                  )}
                  <Toggle
                    checked={pcSelected}
                    css={{
                      gridColumn: 1,
                      gridRow,
                    }}
                    onChange={(checked) => {
                      if (checked) {
                        setters.newPCPacks([
                          ...settings.newPCPacks,
                          pack.collection,
                        ]);
                      } else {
                        setters.newPCPacks(
                          settings.newPCPacks.filter(
                            (x) => x !== pack.collection,
                          ),
                        );
                      }
                    }}
                  />
                  <Toggle
                    css={{
                      gridColumn: 3,
                      gridRow,
                      top: 0,
                    }}
                    checked={npcSelected}
                    onChange={(checked) => {
                      if (checked) {
                        setters.newNPCPacks([
                          ...settings.newNPCPacks,
                          pack.collection,
                        ]);
                      } else {
                        setters.newNPCPacks(
                          settings.newNPCPacks.filter(
                            (x) => x !== pack.collection,
                          ),
                        );
                      }
                    }}
                  />
                  <label
                    className="parp"
                    key={pack.collection}
                    title={pack.collection}
                    htmlFor={id}
                    css={{
                      display: "block",
                      paddingTop: "0.3em",
                      gridColumn: 2,
                      gridRow,
                      textAlign: "center",
                    }}
                  >
                    {pack.metadata.label}
                  </label>
                </IdContext.Provider>
              );
            })}
        </div>
      </SettingsGridFieldStacked>
    </InputGrid>
  );
};

CompendiumPacksSettings.displayName = "CompendiumPacksSettings";
