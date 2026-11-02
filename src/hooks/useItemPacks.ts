import type { ItemPackView } from "../module/snapshots/gameStores";
import { getItemPacksStore } from "../module/snapshots/gameStores";
import { useSnapshot } from "./useSnapshot";

export type { ItemPackView };

/** The Item compendiums, following them being created, deleted or renamed. */
export const useItemPacks = () => useSnapshot(getItemPacksStore());
