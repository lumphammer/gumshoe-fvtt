import { getIsGMStore } from "../module/snapshots/gameStores";
import { useSnapshot } from "./useSnapshot";

/** Whether this user is a GM, following their role changing */
export const useIsGM = () => useSnapshot(getIsGMStore());
