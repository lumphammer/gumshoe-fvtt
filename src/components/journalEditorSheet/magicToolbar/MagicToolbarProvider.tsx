import type { PropsWithChildren } from "react";
import React, { useCallback, useState } from "react";

import {
  MagicToolbarContentContext,
  MagicToolbarRegisterContext,
} from "./contexts";
import type { MagicToolbarContent, MagicToolbarContentEntry } from "./types";

type MagicToolbarProviderProps = PropsWithChildren;

/**
 * Provides the context for the magic toolbar content.
 */
export const MagicToolbarProvider = React.memo<MagicToolbarProviderProps>(
  ({ children }) => {
    const [content, setContent] = useState<MagicToolbarContent>({});

    const register = useCallback(
      (id: string, content: MagicToolbarContentEntry) => {
        setContent((prev) => ({ ...prev, [id]: content }));
      },
      [],
    );

    const unregister = useCallback((id: string) => {
      setContent((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, []);

    return (
      <MagicToolbarRegisterContext.Provider value={{ register, unregister }}>
        <MagicToolbarContentContext.Provider value={content}>
          {children}
        </MagicToolbarContentContext.Provider>
      </MagicToolbarRegisterContext.Provider>
    );
  },
);

MagicToolbarProvider.displayName = "MagicToolbarProvider";
