import { createContext, useContext } from "react";

import { SourceData } from "../../fvtt-exports";

export type TrackerContextType = {
  combatState: SourceData<Combat.Schema> | null;
  combat: Combat.Implementation | null;
  turnIds: string[];
  isActiveUser: boolean;
};

const trackerContext = createContext<TrackerContextType>({
  combatState: null,
  combat: null,
  turnIds: [],
  isActiveUser: false,
});

export const useTrackerContext = () => {
  return useContext(trackerContext);
};

export const TrackerContextProvider = trackerContext.Provider;
