import { nanoid } from "nanoid";
import { useContext } from "react";

import { assertGame } from "../../functions/isGame";
import { ThemeContext } from "../../themes/ThemeContext";
import { IdContext } from "../IdContext";
import { InputGrid } from "../inputs/InputGrid";
import { ListEdit } from "../inputs/ListEdit";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { StateContext } from "./contexts";
import {
  SettingsGridField,
  SettingsGridFieldStacked,
} from "./SettingsGridField";
import { Setters } from "./types";

export const AbilitySettings = ({ setters }: { setters: Setters }) => {
  assertGame(game);
  const { settings } = useContext(StateContext);
  const theme = useContext(ThemeContext);

  let idx = 0;

  return (
    <InputGrid
      css={{
        flex: 1,
        overflow: "auto",
      }}
    >
      <SettingsGridFieldStacked
        label="Compendium packs for new characters"
        index={idx++}
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
            .filter(
              (pack: CompendiumCollection<CompendiumCollection.Metadata>) =>
                pack.metadata.type === "Item",
            )
            .map(
              (
                pack: CompendiumCollection<CompendiumCollection.Metadata>,
                i,
              ) => {
                const pcSelected = settings.newPCPacks.includes(
                  pack.collection,
                );
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
              },
            )}
        </div>
      </SettingsGridFieldStacked>
      <SettingsGridField label="Investigative Ability Categories" index={idx++}>
        <ListEdit
          value={settings.investigativeAbilityCategories}
          onChange={setters.investigativeAbilityCategories}
          nonempty
        />
      </SettingsGridField>
      <SettingsGridField label="General Ability Categories" index={idx++}>
        <ListEdit
          value={settings.generalAbilityCategories}
          onChange={setters.generalAbilityCategories}
          nonempty
        />
      </SettingsGridField>
      <SettingsGridField label="Combat Abilities" index={idx++}>
        <ListEdit
          value={settings.combatAbilities}
          onChange={setters.combatAbilities}
          nonempty
        />
      </SettingsGridField>
      <SettingsGridField label="Can Abilities be Boosted?" index={idx++}>
        <Toggle checked={settings.useBoost} onChange={setters.useBoost} />
      </SettingsGridField>
      <SettingsGridField
        label="Show empty Investigative categories?"
        index={idx++}
      >
        <Toggle
          checked={settings.showEmptyInvestigativeCategories}
          onChange={setters.showEmptyInvestigativeCategories}
        />
      </SettingsGridField>
      <SettingsGridField label="Use NPC Combat bonuses?" index={idx++}>
        <Toggle
          checked={settings.useNpcCombatBonuses}
          onChange={setters.useNpcCombatBonuses}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

AbilitySettings.displayName = "AbilitySettings";
