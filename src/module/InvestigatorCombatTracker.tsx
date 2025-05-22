import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";

import { Tracker as ReactCombatTracker } from "../components/combat/Tracker";
import { ErrorBoundary } from "../components/ErrorBoundary";

export class InvestigatorCombatTrackerBase extends CombatTracker {}

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
