import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";

import { Tracker as ReactCombatTracker } from "../components/combat/Tracker";
import { ErrorBoundary } from "../components/ErrorBoundary";

export class InvestigatorCombatTrackerBase extends CombatTracker {
  /** @override */
  // static get defaultOptions() {
  //   return {
  //     ...super.defaultOptions,
  //     template: reactifiedCombatSidebarTemplatePath,
  //   };
  // }
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["investigator"],
    // position: {
    //   width: 450,
    //   height: 600,
    // },
    // window: {
    //   resizable: true,
    // },
  };

  // we do love a hack. there is a weird behaviour in FVTT where when you pop
  // out the combat tracker, it gets auto-size some some proportion of the
  // screen height. This makes it less usable than the normal version. it comes
  // down to Application#createPopout which doesn't make the popout resizable.
  // So this override does everything from CombatTracker.createPopout and
  // Application#createPopout, but adds the `resizable` option.
  // createPopout() {
  //   if (this._popout) return this._popout;
  //   // I can't see a good way to avoid this circularity, but it's fine.
  //   // I SAID IT'S FINE.
  //   // eslint-disable-next-line @typescript-eslint/no-use-before-define
  //   const pop = new InvestigatorCombatTracker({
  //     popOut: true,
  //     height: window.innerHeight - 200,
  //     // ta-da
  //     resizable: true,
  //   }) as unknown as this; // the typing is a mess
  //   this._popout = pop;
  //   pop._original = this;
  //   pop.initialize({ combat: this.viewed, render: true });
  //   return pop;
  // }
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
