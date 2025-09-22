import { createContext, useContext } from "react";

import { SourceData } from "../../fvtt-exports";

export type TrackerContextType = {
  combatState: SourceData<Combat.Schema> | null;
  combat: Combat.Implementation | null;
  turns: SourceData<Combatant.Schema>[];
  isActiveUser: boolean;
};

const trackerContext = createContext<TrackerContextType>({
  combatState: null,
  combat: null,
  turns: [],
  isActiveUser: false,
});

export const useTrackerContext = () => {
  return useContext(trackerContext);
};

export const TrackerContextProvider = trackerContext.Provider;
