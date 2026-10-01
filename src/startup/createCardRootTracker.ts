type TrackedElement = Pick<HTMLElement, "isConnected">;
type TrackedRoot = { unmount: () => void };

type Entry = {
  el: TrackedElement;
  root: TrackedRoot;
  seenInPage: boolean;
};

/**
 * Keeps track of the React roots we create for chat cards, and unmounts them
 * once Foundry has thrown their element away (which it does every time a
 * message re-renders). Without this, old roots stay in memory for as long as
 * anything in them - e.g. a Foundry hook listener - is still around.
 *
 * Cards are rendered before Foundry puts them into the page, so "not in the
 * page" can mean "not there yet". We only unmount a card once we've seen it in
 * the page and then seen it gone.
 *
 * `schedule` decides when to check: it needs to be late enough for Foundry to
 * have swapped the old element for the new one.
 */
export function createCardRootTracker(
  schedule: (callback: () => void) => void,
) {
  const entries = new Set<Entry>();
  let sweepPending = false;

  function sweep() {
    sweepPending = false;
    for (const entry of entries) {
      if (entry.el.isConnected) {
        entry.seenInPage = true;
      } else if (entry.seenInPage) {
        entries.delete(entry);
        entry.root.unmount();
      }
    }
  }

  function scheduleSweep() {
    if (sweepPending) return;
    sweepPending = true;
    schedule(sweep);
  }

  return {
    track(el: TrackedElement, root: TrackedRoot) {
      entries.add({ el, root, seenInPage: false });
      scheduleSweep();
    },
    scheduleSweep,
    /** for tests and measurement */
    get size() {
      return entries.size;
    },
  };
}
