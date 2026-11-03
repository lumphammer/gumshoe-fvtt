/**
 * An actor's live items with these ids (e.g. selected from a snapshot), in
 * order, skipping any which have gone or aren't of the type `is` checks for:
 * to hand to memoised rows, which read their own snapshots and write to the
 * items.
 */
export function liveItems<T>(
  actor: Actor | null | undefined,
  ids: readonly string[],
  is: (item: unknown) => item is T,
): T[] {
  return ids.flatMap((id) => {
    const item = actor?.items.get(id);
    return is(item) ? [item] : [];
  });
}

/** One of an actor's live items, if it's still there and of the type `is` checks for */
export function liveItem<T>(
  actor: Actor | null | undefined,
  id: string,
  is: (item: unknown) => item is T,
): T | undefined {
  return liveItems(actor, [id], is)[0];
}
