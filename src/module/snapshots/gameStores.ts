// Stores of the game's state, outside any one document, for components to
// read through `useSnapshot` (see `hookStores.ts`).

import * as constants from "../../constants";
import { runtimeConfig } from "../../runtime";
import { createHookCounter, createHookStore, onHook, once } from "./hookStores";

/** What's shown of an Item compendium */
export type ItemPackView = {
  /** its collection id ("package.pack") */
  id: string;
  label: string;
  packageType: string;
  packageName: string;
};

/**
 * The Item compendiums. Foundry re-renders the compendium sidebar whenever a
 * compendium is created, deleted, renamed or reconfigured.
 */
export const getItemPacksStore = once(() =>
  createHookStore(
    (): ItemPackView[] =>
      (game as foundry.Game).packs
        .filter((pack) => pack.metadata.type === "Item")
        .map((pack) => ({
          id: pack.collection,
          label: pack.metadata.label,
          packageType: pack.metadata.packageType,
          packageName: pack.metadata.packageName,
        })),
    [onHook("renderCompendiumDirectory")],
  ),
);

/**
 * The installed presets and themes. The registries keep their identity as
 * they're added to, so this copies them (their entries keep theirs).
 */
export const getRuntimeRegistriesStore = once(() =>
  createHookStore(
    () => ({
      presets: { ...runtimeConfig.presets },
      themes: { ...runtimeConfig.themes },
    }),
    [onHook(constants.runtimeConfigChanged), onHook(constants.themeHMR)],
  ),
);

/**
 * Goes up when compendiums are configured (e.g. locked or unlocked): an entry
 * in a compendium can only be edited while it's unlocked, and that's in a
 * setting, not the entry.
 */
export const getCompendiumConfigCounter = once(() => {
  const isConfig = (setting: Setting.Implementation) =>
    setting.key === "core.compendiumConfiguration";
  return createHookCounter([
    onHook("createSetting", isConfig),
    onHook("updateSetting", isConfig),
  ]);
});

/**
 * Goes up when a token's actor could have changed: tokens being created or
 * deleted, or one being given another actor, or linked or unlinked. (Not on
 * every token update: that's every move.)
 */
export const getTokenActorsCounter = once(() =>
  createHookCounter([
    onHook("createToken"),
    onHook("deleteToken"),
    onHook(
      "updateToken",
      (_token, changes) => "actorId" in changes || "actorLink" in changes,
    ),
  ]),
);

/** A token this user has targeted */
export type UserTargetView = { uuid: string; name: string };

/**
 * The tokens this user has targeted, in the order they targeted them (as
 * attacks use them): changes when they target or untarget one, when one is
 * renamed or deleted, or when a new scene clears them.
 */
export const getUserTargetsStore = once(() =>
  createHookStore(
    (): UserTargetView[] =>
      Array.from((game as foundry.Game).user?.targets ?? []).map((token) => ({
        uuid: token.document.uuid ?? "",
        name: token.document.name ?? "",
      })),
    [
      onHook("targetToken"),
      onHook("updateToken"),
      onHook("deleteToken"),
      onHook("canvasReady"),
    ],
  ),
);
