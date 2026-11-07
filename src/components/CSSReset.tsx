import createCache from "@emotion/cache";
import { css } from "@emotion/css";
import { CacheProvider as EmotionCacheProvider, Global } from "@emotion/react";
import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type { PropsWithChildren } from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

import { ApplicationV2 } from "../fvtt-exports";
import { css as pandaCss, cx } from "../styled-system/css";
import { sheetRoot } from "../styled-system/recipes";
import { catalogueOverridesCss } from "../themes/catalogue/overrides";
import { paletteFromV1, paletteStyle, themeSlug } from "../themes/palette";
import { ThemeContext } from "../themes/ThemeContext";
import type { ThemeV1 } from "../themes/types";
import { ErrorBoundary } from "./ErrorBoundary";

type CSSResetProps = PropsWithChildren<{
  className?: string;
  theme: ThemeV1;
  mode: "large" | "small" | "none";
  noStyleAppWindow?: boolean;
}>;

function safeGetAppId(app: ApplicationV2 | undefined | null) {
  if (app instanceof ApplicationV2) {
    return app.id;
  } else {
    return undefined;
  }
}

function safeGetAppElement(app: ApplicationV2 | undefined | null) {
  if (app instanceof ApplicationV2) {
    return app.element;
  } else {
    return undefined;
  }
}

export const CSSReset = ({
  className,
  children,
  theme,
  mode,
  noStyleAppWindow = false,
}: CSSResetProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // add app window styles if there's a containing app window
  useEffect(() => {
    // interacting with Foundry's stuff with jQuery feels a bit 2001 but putting
    // it in a hook keeps is nice and encapsulated.
    const className = css(theme.appWindowStyle);
    if (ref.current !== null && !noStyleAppWindow) {
      const el = jQuery(ref.current).closest(".window-app");
      el.addClass(className);
      return function () {
        el.removeClass(className);
      };
    }
  }, [noStyleAppWindow, theme.appWindowStyle]);

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

  const cache = useMemo(() => {
    return createCache({
      key: "investigator",
      container: head ?? undefined,
    });
  }, [head]);

  const slug = themeSlug(theme);
  // the theme's replacements for catalogue classes, as a <style> inside the
  // root, so that it goes wherever the root goes, detached windows included
  const overridesCss = useMemo(
    () =>
      theme.catalogue ? catalogueOverridesCss(slug, theme.catalogue) : null,
    [slug, theme.catalogue],
  );

  return (
    <ErrorBoundary>
      <EmotionCacheProvider value={cache}>
        <ThemeContext.Provider value={theme}>
          <Global styles={theme.global} />
          <div
            ref={ref}
            className={cx(
              sheetRoot({ size: mode }),
              pandaCss({
                padding: mode === "none" ? "0" : "0.5em",
                height: "100%",
              }),
              className,
            )}
            data-inv-theme={slug}
            style={paletteStyle(paletteFromV1(theme))}
          >
            {children}
            {overridesCss && <style>{overridesCss}</style>}
          </div>
        </ThemeContext.Provider>
      </EmotionCacheProvider>
    </ErrorBoundary>
  );
};

CSSReset.displayName = "CSSReset";
