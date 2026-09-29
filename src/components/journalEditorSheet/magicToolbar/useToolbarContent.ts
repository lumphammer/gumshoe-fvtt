import type { ReactNode } from "react";
import { useContext, useEffect, useId, useMemo } from "react";

import { MagicToolbarRegisterContext } from "./contexts";
import type { MagicToolbarContentEntry } from "./types";

/**
 * Register content with the magic toolbar. HIGHLY recommended to use `useMemo`
 * inside the call to this hook to stabilise the content.
 */
export function useToolbarContent(category: string, content: ReactNode) {
  const id = useId();

  const { register, unregister } = useContext(MagicToolbarRegisterContext);

  const contentObject = useMemo<MagicToolbarContentEntry>(
    () => ({ category, content }),
    [category, content],
  );

  useEffect(() => {
    register(id, contentObject);
    return () => {
      unregister(id);
    };
  }, [content, contentObject, id, register, unregister]);
}
