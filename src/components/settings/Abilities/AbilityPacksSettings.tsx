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

type Pack = ReturnType<NonNullable<typeof game.packs>["filter"]>[number];

/**
 * Where a pack comes from: the system itself, the world, or a module (by
 * its title.)
 */
const getPackSource = (pack: Pack): string => {
  assertGame(game);
  const { packageType, packageName } = pack.metadata;
  if (packageType === "system") {
    return getTranslated("Built in");
  }
  if (packageType === "world") {
    return getTranslated("World");
  }
  return game.modules.get(packageName)?.title ?? packageName;
};

/**
 * Where a selected pack which isn't in `game.packs` came from, going by its
 * collection id ("package.pack"). Usually a deleted world pack, or a pack
 * from a module which isn't active at the moment.
 */
const getMissingPackSource = (collection: string): string => {
  assertGame(game);
  const packageName = collection.split(".")[0];
  const source =
    packageName === "world"
      ? getTranslated("World")
      : packageName === game.system.id
        ? getTranslated("Built in")
        : (game.modules.get(packageName)?.title ?? packageName);
  return getTranslated("MissingPackSource", { Source: source });
};

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

  const packs = [
    ...game.packs
      .filter((pack) => pack.metadata.type === "Item")
      .map((pack) => ({
        collection: pack.collection,
        label: pack.metadata.label,
        source: getPackSource(pack),
        missing: false,
      })),
    // selected packs which don't exist (deleted, or from an inactive module)
    // are listed so they can be unticked, rather than pruned, because an
    // inactive module's packs will come back
    ...selectedPacks
      .filter((collection) => !game.packs.has(collection))
      .map((collection) => ({
        collection,
        label: collection,
        source: getMissingPackSource(collection),
        missing: true,
      })),
  ];
  const selectedCount = selectedPacks.length;
  const baseId = useId();
  const [search, setSearch] = useState("");

  // match on the label people see, where it comes from, and the collection id
  // (which includes the package name)
  const needle = search.trim().toLocaleLowerCase();
  const visiblePacks =
    needle === ""
      ? packs
      : packs.filter(({ label, source, collection }) =>
          [label, source, collection].some((text) =>
            text.toLocaleLowerCase().includes(needle),
          ),
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
          <Translate values={{ Count: selectedCount.toString() }}>
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
          gridTemplateColumns: "max-content 1fr max-content",
          columnGap: "0.5em",
        }}
      >
        {visiblePacks.map(({ collection, label, source, missing }, i) => {
          const id = `${baseId}-${collection}`;
          return (
            <IdContext.Provider value={id} key={collection}>
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
                  checked={selectedPacks.includes(collection)}
                  onChange={(checked) => {
                    setSelectedPacks(
                      checked
                        ? [...selectedPacks, collection]
                        : selectedPacks.filter((x) => x !== collection),
                    );
                  }}
                />
                <label htmlFor={id} title={collection}>
                  {label}
                </label>
                <span
                  css={{
                    fontStyle: "italic",
                    opacity: missing ? undefined : 0.75,
                    color: missing ? theme.colors.warning : undefined,
                  }}
                >
                  {source}
                </span>
              </div>
            </IdContext.Provider>
          );
        })}
      </div>
    </div>
  );
};

AbilityPacksSettings.displayName = "AbilityPacksSettings";
