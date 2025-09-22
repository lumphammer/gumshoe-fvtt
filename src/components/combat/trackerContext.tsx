import { createContext, useContext } from "react";

import { SourceData } from "../../fvtt-exports";

export type TrackerContextType = {
  combat: SourceData<Combat.Schema> | null;
  turns: SourceData<Combatant.Schema>[];
  isActiveUser: boolean;
};

const trackerContext = createContext<TrackerContextType>({
  combat: null,
  turns: [],
  isActiveUser: false,
});

export const useTrackerContext = () => {
  return useContext(trackerContext);
};

export const TrackerContextProvider = trackerContext.Provider;
