import type { ComponentType } from "react";
import { memo } from "react";

import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";

type LiveActorIslandProps = {
  /** A component not yet converted to snapshots, which reads the live actor */
  component: ComponentType;
};

/**
 * A stepping stone, for a part of a memoised sheet that hasn't been converted
 * to snapshots yet (see docs/immutable-data.md). It re-renders `component` on
 * any change to the sheet's actor (its data, items or effects) or to the
 * settings, as Foundry's re-render of the whole sheet used to. Takes a
 * component, not children: the same children element would let React skip
 * re-rendering them.
 */
export const LiveActorIsland = memo(function LiveActorIsland({
  component: Component,
}: LiveActorIslandProps) {
  const { actor } = useActorSheetContext();
  useActorSnapshot(actor, (snapshot) => snapshot);
  useSettings((settings) => settings);
  return <Component />;
});
