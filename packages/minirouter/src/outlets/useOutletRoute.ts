import type { ReactNode } from "react";
import { useContext, useEffect, useId, useMemo } from "react";

import { useNavigationContext } from "../useNavigationContext";
import { OutletContext } from "./OutletContext";

export const useOutletRoute = (content: ReactNode) => {
  const routeId = useId();
  const outletContext = useContext(OutletContext);
  const { currentStep } = useNavigationContext();
  const stepId = currentStep?.id ?? "";

  // the effective id of this route has to be a combination of the step id and
  // an additional id for the route itself. If we just use the step is, we can't
  // differentiate between multiple routes, and if we just use the route id, we
  // can't differentiate between multiple (presumbaly different params) steps.
  const id = useMemo(() => `${stepId}-${routeId}`, [routeId, stepId]);

  useEffect(() => {
    if (outletContext) {
      outletContext.register(id, content);
      return () => {
        outletContext.unregister(id);
      };
    }
  }, [content, outletContext, id]);
  return outletContext ? null : content;
};
