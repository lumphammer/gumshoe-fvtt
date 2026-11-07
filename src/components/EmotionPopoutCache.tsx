import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type { PropsWithChildren } from "react";
import { useContext, useEffect, useMemo, useState } from "react";

import { ApplicationV2 } from "../fvtt-exports";

function safeGetAppId(app: ApplicationV2 | undefined | null) {
  return app instanceof ApplicationV2 ? app.id : undefined;
}

function safeGetAppElement(app: ApplicationV2 | undefined | null) {
  return app instanceof ApplicationV2 ? app.element : undefined;
}

/**
 * Emotion inserts its rules when a class is first used, into the document it
 * was told about. A popped-out window copies our stylesheets once, so Emotion
 * rules used after that must go into its document instead: this follows the
 * app there. Only for the `css` props not converted to Panda yet; goes when
 * Emotion does (#1532).
 */
export const EmotionPopoutCache = ({ children }: PropsWithChildren) => {
  const app = useContext(FoundryAppContext);

  const [head, setHead] = useState(safeGetAppElement(app)?.closest("head"));

  useEffect(() => {
    // if we don't have an id, we can't tell whether a popped-out app is ours,
    // so don't try to match - two undefineds are not the same app.
    const appId = safeGetAppId(app);
    const popoutHandler = (poppedApp: ApplicationV2, newWindow: Window) => {
      if (appId !== undefined && safeGetAppId(poppedApp) === appId) {
        setHead(newWindow.document.head);
      }
    };
    const dialogHandler = (
      dialoggedApp: ApplicationV2,
      info: PopOut.DialogHookInfo,
    ) => {
      if (appId !== undefined && safeGetAppId(dialoggedApp) === appId) {
        setHead(info.window.document.head);
      }
    };
    Hooks.on("PopOut:popout", popoutHandler);
    Hooks.on("PopOut:dialog", dialogHandler);
    return () => {
      Hooks.off("PopOut:popout", popoutHandler);
      Hooks.off("PopOut:dialog", dialogHandler);
    };
  }, [app]);

  const cache = useMemo(
    () => createCache({ key: "investigator", container: head ?? undefined }),
    [head],
  );

  return <CacheProvider value={cache}>{children}</CacheProvider>;
};
