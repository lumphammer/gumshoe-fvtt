import { useContext, useId, useState } from "react";

import { assertGame } from "../../../functions/isGame";
import { ThemeContext } from "../../../themes/ThemeContext";
import { IdContext } from "../../IdContext";
import { Toggle } from "../../inputs/Toggle";
import { getTranslated } from "../../../functions/getTranslated";
import { Translate } from "../../Translate";
import { StateContext } from "../contexts";
import { SettingsEmptyState } from "../SettingsEmptyState";
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
  const [search, setSearch] = useState("");

  // match on the label people see, and the collection id (which includes the
  // package name, so you can find everything from one module)
  const needle = search.trim().toLocaleLowerCase();
  const visiblePacks =
    needle === ""
      ? packs
      : packs.filter(
          (pack) =>
            pack.metadata.label.toLocaleLowerCase().includes(needle) ||
            pack.collection.toLocaleLowerCase().includes(needle),
        );

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
          position: "sticky",
          top: 0,
          zIndex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.5em",
          padding: "0.5em 0",
          background: theme.colors.bgOpaquePrimary,
        }}
      >
        <input
          type="search"
          css={{ flex: 1 }}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder={getTranslated("Search compendium packs")}
          aria-label={getTranslated("Search compendium packs")}
        />
        <span css={{ whiteSpace: "nowrap", opacity: 0.75 }}>
          <Translate values={{ Count: selectedPacks.length.toString() }}>
            CountSelected
          </Translate>
        </span>
      </div>
      {visiblePacks.length === 0 && (
        <SettingsEmptyState
          message={
            packs.length === 0
              ? "There are no item compendium packs."
              : "No compendium packs match your search."
          }
        />
      )}
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          columnGap: "0.5em",
        }}
      >
        {visiblePacks.map((pack, i) => {
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
