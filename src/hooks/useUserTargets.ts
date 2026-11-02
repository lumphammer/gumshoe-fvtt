import type { UserTargetView } from "../module/snapshots/gameStores";
import { getUserTargetsStore } from "../module/snapshots/gameStores";
import { useSnapshot } from "./useSnapshot";

export type { UserTargetView };

/**
 * The tokens this user has targeted, in the order they targeted them (as
 * attacks use them), following them being targeted, renamed or deleted.
 */
export const useUserTargets = () => useSnapshot(getUserTargetsStore());
