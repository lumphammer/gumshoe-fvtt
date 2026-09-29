import type { PropsWithChildren } from "react";
import React, { useMemo, useState } from "react";

import { NavigationContext } from "../NavigationContext";
import type { AnyStep, NavigationContextValue } from "../types";

function deepEquals(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const Router: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<AnyStep[]>([]);
  const navigationContextValue = useMemo<NavigationContextValue>(
    () => ({
      navigate: (from, to) => {
        const isUp = to === "up";
        const toArray = isUp ? [] : Array.isArray(to) ? to : [to];
        setCurrentPath((currentPath) => {
          // first we build up the "new path" according to whatever "from" mode
          // we're in
          let newPath: AnyStep[];
          if (from === "root" || from === "here") {
            newPath = toArray;
          } else {
            const fromIndex = currentPath.findLastIndex(
              (step) => step.direction === from,
            );
            if (fromIndex === -1) {
              throw new Error(`Cannot navigate from ${from.description}`);
            }
            return [...currentPath.slice(0, fromIndex + 1), ...toArray];
          }
          if (to === "up") {
            if (newPath.length === 0) {
              throw new Error("Cannot navigate up from root (says Router)");
            }
            newPath = currentPath.slice(0, currentPath.length - 1);
          }
          // now we map the newpath, and if any step elements match the old
          // path in all but id, we replace them with the old one.
          // we do this because steps are recreated on every render, so they can
          // have different ids, and we want navigation to remain stable.
          newPath = newPath.map((step, i) => {
            if (
              currentPath[i] &&
              step.direction === currentPath[i].direction &&
              (step.params === currentPath[i].params ||
                deepEquals(step.params, currentPath[i].params))
            ) {
              return currentPath[i];
            } else {
              return step;
            }
          });
          return newPath;
        });
      },
      currentStep: currentPath[0],
      parentSteps: [],
      childSteps: currentPath.slice(1),
    }),
    [currentPath],
  );
  return (
    <NavigationContext.Provider value={navigationContextValue}>
      {children}
    </NavigationContext.Provider>
  );
};
