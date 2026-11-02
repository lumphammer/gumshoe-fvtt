import { useMemo, useSyncExternalStore } from "react";

import { assertGame } from "../functions/isGame";

/** What's shown of an Item compendium */
export type ItemPackView = {
  /** its collection id ("package.pack") */
  id: string;
  label: string;
  packageType: string;
  packageName: string;
};

// The Item compendiums, as JSON: a string, so it only changes when they do
const readItemPacks = () => {
  assertGame(game);
  return JSON.stringify(
    game.packs
      .filter((pack) => pack.metadata.type === "Item")
      .map((pack): ItemPackView => ({
        id: pack.collection,
        label: pack.metadata.label,
        packageType: pack.metadata.packageType,
        packageName: pack.metadata.packageName,
      })),
  );
};

// Foundry re-renders the compendium sidebar whenever a compendium is created,
// deleted, renamed or reconfigured
const subscribeToPacks = (onChange: () => void) => {
  const id = Hooks.on("renderCompendiumDirectory", onChange);
  return () => Hooks.off("renderCompendiumDirectory", id);
};

/**
 * The Item compendiums, following them being created, deleted or renamed.
 * (Read as a hook, not during a compiled render, which would keep the first
 * answer.)
 */
export function useItemPacks(): ItemPackView[] {
  const packs = useSyncExternalStore(subscribeToPacks, readItemPacks);
  return useMemo(() => JSON.parse(packs) as ItemPackView[], [packs]);
}
