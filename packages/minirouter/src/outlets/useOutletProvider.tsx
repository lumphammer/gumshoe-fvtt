import type { ReactNode } from "react";
import React, { useCallback, useMemo, useState } from "react";

import type { OutletContextValue } from "../types";
import { OutletContext } from "./OutletContext";

/**
 * Be an outlet
 */
export const useOutletProvider = (children: ReactNode) => {
  const [registry, setRegistry] = useState<Record<string, React.ReactNode>>({});

  const register = useCallback(
    (id: string, content: React.ReactNode) => {
      setRegistry((prev) => ({ ...prev, [id]: content }));
    },
    [setRegistry],
  );

  const unregister = useCallback(
    (id: string) => {
      setRegistry((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    },
    [setRegistry],
  );

  const outletContextValue = useMemo<OutletContextValue>(
    () => ({
      register,
      unregister,
    }),
    [register, unregister],
  );

  const content = (
    <>
      {/* render all registered content but NOT inside the outlet context */}
      {/* {Object.entries(registry).map(([id, content]) => (
        <Fragment key={id}>{content}</Fragment>
      ))} */}
      {/* render the children inside the outlet context so they report back
      up to here */}
      <OutletContext.Provider value={outletContextValue}>
        {children}
      </OutletContext.Provider>
    </>
  );
  return { content, registry };
};
