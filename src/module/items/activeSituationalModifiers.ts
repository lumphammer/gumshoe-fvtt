// Which of an ability's situational modifiers are switched on for its next
// test. Not saved: it's this client's choice, just until the test. Kept here,
// by the ability's UUID, rather than on its system data, because Foundry
// replaces an item's system data whenever the item updates (and with it,
// anything kept there), and so React can subscribe to it.

const empty: readonly string[] = [];
const activeByUuid = new Map<string, readonly string[]>();
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

/** The ids of the ability's active situational modifiers */
export function getActiveSituationalModifiers(uuid: string): readonly string[] {
  return activeByUuid.get(uuid) ?? empty;
}

/** Switch one of an ability's situational modifiers on or off */
export function toggleActiveSituationalModifier(uuid: string, id: string) {
  const active = getActiveSituationalModifiers(uuid);
  const next = active.includes(id)
    ? active.filter((activeId) => activeId !== id)
    : [...active, id];
  if (next.length === 0) activeByUuid.delete(uuid);
  else activeByUuid.set(uuid, next);
  notify();
}

/** Switch off all of an ability's situational modifiers (e.g. after a test) */
export function clearActiveSituationalModifiers(uuid: string) {
  if (activeByUuid.delete(uuid)) notify();
}

/** Listen for changes, for `useSyncExternalStore` */
export function subscribeToActiveSituationalModifiers(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
