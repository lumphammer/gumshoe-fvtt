import { createContext, useContext, useMemo } from "react";

import { assertGame } from "../../functions/isGame";
import { useCombatSnapshot } from "../../hooks/useCombatSnapshot";

export type TrackerContextValue<
  SubType extends Combat.ConfiguredSubType | null =
    Combat.ConfiguredSubType | null,
> = {
  combat: SubType extends Combat.ConfiguredSubType
    ? Combat.OfType<SubType>
    : null;
  /** the round and turn, from the combat's snapshot */
  combatState: { round: number; turn: number | null } | null;
  turnIds: readonly string[];
  isActiveUser: boolean;
};

const defaultTrackerValue: TrackerContextValue = {
  combatState: null,
  combat: null,
  turnIds: [],
  isActiveUser: false,
};

const TrackerContext = createContext<TrackerContextValue>(defaultTrackerValue);

export const useTrackerContext = () => {
  return useContext(TrackerContext);
};

/**
 * What the tracker shows of a combat, from its snapshot, so it follows the
 * combat and its combatants. Which combat that is (the active one) is read
 * live by the tracker, which Foundry re-renders when combats are created,
 * deleted or activated.
 */
export const useTrackerContextValue = (
  combat: Combat.Known | null,
): TrackerContextValue => {
  assertGame(game);
  const user = game.user;
  const view = useCombatSnapshot(combat, (snapshot) => {
    if (snapshot === null) return null;
    return {
      combatState: { round: snapshot.round, turn: snapshot.turn },
      turnIds: snapshot.turnIds,
      // (the live combat's, but a selector runs again on every change to it)
      isActiveUser: combat?.combatant?.players?.includes(user) ?? false,
    };
  });
  // the same value while the combat and its view are (the view is
  // structurally shared), so the tracker's other renders don't reach the list
  return useMemo(
    () =>
      combat === null || view === null
        ? defaultTrackerValue
        : { combat, ...view },
    [combat, view],
  );
};

export const TrackerContextProvider = TrackerContext.Provider;
