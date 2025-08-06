import { PropsWithChildren, useMemo } from "react";

// import { DevTools } from "./DevTools";
import { NavigationContext } from "./NavigationContext";
import { OutletContext } from "./outlets/OutletContext";
import { useOutletRoute } from "./outlets/useOutletRoute";
import { AnyDirection, AnyStep, NavigationContextValue } from "./types";
import { useNavigationContext } from "./useNavigationContext";

type UseRouteArgs = PropsWithChildren<{
  direction: AnyDirection;
}>;

export function useRoute({ direction, children }: UseRouteArgs) {
  const outerContext = useNavigationContext();
  const navigationContextValue = useMemo<NavigationContextValue>(
    () => ({
      navigate: (from, to) => {
        const isUp = to === "up";
        const toArray = isUp ? [] : Array.isArray(to) ? to : [to];
        let rootTo: AnyStep[];

        // if we're navigating from the root, this is easy
        if (from === "root") {
          rootTo = toArray;
        } else if (from === "here") {
          // if we're navigating from "here", we nned to do  some array gluing
          rootTo = [
            ...outerContext.parentSteps,
            ...(outerContext.currentStep ? [outerContext.currentStep] : []),
            ...toArray,
          ];
        } else if (from.match(outerContext.currentStep)) {
          // if we're navigating from a particular direction, but that direction
          // is the current step, we can just use the parent steps and add the
          // "to" array
          rootTo = [
            ...outerContext.parentSteps,
            outerContext.currentStep,
            ...toArray,
          ];
        } else {
          // otherwise if we're navigating from a parent step we need to do
          // a bit more surgery
          const fromIndex = outerContext.parentSteps.findLastIndex(
            (step) => step.direction === from,
          );
          if (fromIndex === -1) {
            throw new Error(`Cannot navigate from ${from.description}`);
          }
          rootTo = [
            ...outerContext.parentSteps.slice(0, fromIndex + 1),
            ...toArray,
          ];
        }
        if (isUp) {
          if (rootTo.length === 0) {
            throw new Error("Cannot navigate up from root (from useRoute)");
          }
          rootTo = rootTo.slice(0, -1);
        }
        outerContext.navigate("root", rootTo);
      },
      currentStep: outerContext.childSteps[0],
      parentSteps: outerContext.currentStep
        ? [...outerContext.parentSteps, outerContext.currentStep]
        : [],
      childSteps: outerContext.childSteps.slice(1),
    }),
    [outerContext],
  );

  const content =
    outerContext.currentStep?.direction === direction ? (
      <>
        <NavigationContext.Provider value={navigationContextValue}>
          <OutletContext.Provider value={null}>
            {children}
          </OutletContext.Provider>
        </NavigationContext.Provider>
        {/* <DevTools /> */}
      </>
    ) : null;

  return useOutletRoute(content);
}
