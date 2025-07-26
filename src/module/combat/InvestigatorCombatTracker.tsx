import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";

import { Tracker as ReactCombatTracker } from "../../components/combat/Tracker";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { CombatTracker } from "../../fvtt-exports";

// HandlebarsApplicationMixin(AbstractSidebarTab);

export class InvestigatorCombatTrackerBase extends CombatTracker {
  // we're going to handle our own menu, thanks. CombatTracker will not do the
  // menu at all if the list is empty
  override _getEntryContextOptions() {
    return [];
  }
}

const render = () => {
  return (
    <ErrorBoundary>
      <ReactCombatTracker />
    </ErrorBoundary>
  );
};

export const InvestigatorCombatTracker = ReactApplicationV2Mixin(
  "InvestigatorCombatTracker",
  InvestigatorCombatTrackerBase as unknown as any,
  render,
);
