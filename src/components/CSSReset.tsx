import createCache from "@emotion/cache";
import { css } from "@emotion/css";
import {
  CacheProvider as EmotionCacheProvider,
  CSSObject,
  Global,
} from "@emotion/react";
import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import {
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { irid } from "../irid/irid";
import { ThemeContext } from "../themes/ThemeContext";
import { ThemeV1 } from "../themes/types";
import { ErrorBoundary } from "./ErrorBoundary";

type CSSResetProps = PropsWithChildren<{
  className?: string;
  theme: ThemeV1;
  mode: "large" | "small" | "none";
  noStyleAppWindow?: boolean;
}>;

function safeGetAppId(
  app: Application | foundry.applications.api.ApplicationV2 | undefined | null,
) {
  if (app instanceof Application) {
    return app.appId.toString();
  } else if (app instanceof foundry.applications.api.ApplicationV2) {
    return app.id;
  } else {
    return undefined;
  }
}

function safeGetAppElement(
  app: Application | foundry.applications.api.ApplicationV2 | undefined | null,
) {
  if (app instanceof Application) {
    return app?.element.get(0);
  } else if (app instanceof foundry.applications.api.ApplicationV2) {
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
    const popoutHandler = (poppedApp: Application, newWindow: Window) => {
      if (safeGetAppId(poppedApp) === safeGetAppId(app)) {
        setHead(newWindow.document.head);
      }
    };
    const dialogHandler = (
      dialoggedApp: Application,
      info: PopOut.DialogHookInfo,
    ) => {
      if (safeGetAppId(dialoggedApp) === safeGetAppId(app)) {
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

  const styles = useMemo<CSSObject>(() => {
    const rootStyle =
      mode === "large"
        ? theme.largeSheetRootStyle
        : mode === "small"
          ? theme.smallSheetRootStyle
          : {};

    const groove1 = irid(theme.colors.controlBorder);
    const groove2 = groove1.contrast();

    const [grooveLight, grooveDark] =
      groove1.luma() < groove2.luma()
        ? [groove1.toString(), groove2.toString()]
        : [groove2.toString(), groove1.toString()];

    const styles: CSSObject = {
      font: theme.bodyFont,
      padding: mode === "none" ? "0" : "0.5em",
      color: theme.colors.text,
      backgroundColor: mode === "none" ? "transparent" : theme.colors.wallpaper,
      height: "100%",
      accentColor: theme.colors.accent,
      // this is outside the `:where` cluse below because we need to
      // override Foundry's CSS for buttons, which use the
      // selector `form button` (specificity 0 0 2).
      // `:where(.abc123) button` has a specificity of 0 0 1.
      // Putting this up here comes out as `.abc123 button` which is
      // specificity 0 1 1.
      "button, input[type=button]": {
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: `${grooveLight} ${grooveDark} ${grooveDark} ${grooveLight}`,
        background: theme.colors.backgroundButton,
        boxShadow: ` -1px -1px 0 0 ${grooveLight} inset, 1px 1px 0 0 ${grooveDark} inset`,
      },
      // fix specificity. The comma causes this to be interpreted as a
      // new selector, i.e. it comes out as
      // ```
      // , :where(.abc123) button { ... }
      // ```
      // the :where means that this selector does not add to specificity
      // so we can override all these rules without having to use
      // specificity hacks like `"&&": {...}`.
      //
      // The downside of controlling specificity this way is that these
      // rules will *not* override Foundry's own styles in some
      // circumstances.
      ",:where(&) ": {
        "*": {
          scrollbarWidth: "thin",
          userSelect: "auto",
          boxSizing: "border-box",
          scrollbarColor: `${theme.colors.accent} ${theme.colors.backgroundButton}`,
          "&:focus": {
            textDecoration: "underline",
          },
        },

        "h1, h2, h3, h4": {
          border: "none",
          margin: "0.3em 0 0 0",
          marginBottom: "0.3em",
          padding: 0,
          fontWeight: "inherit",
          font: theme.displayFont,
        },
        h1: {
          fontSize: "1.5em",
        },
        h2: {
          fontSize: "1.3em",
        },
        h3: {
          fontSize: "1.1em",
        },
        h4: {
          fontSize: "1em",
        },
        "button, input[type=button]": {
          font: theme.displayFont,
          color: theme.colors.accent,
          borderRadius: "5px",
          // 100% was causing scrollbars in some places
          width: "99%",
          "&[disabled]": {
            opacity: 0.5,
            color: theme.colors.text,
            "&:hover": {
              boxShadow: "none",
              textShadow: "none",
            },
          },
          "&:hover": {
            boxShadow: `0 0 0.5em ${theme.colors.glow}`,
            textShadow: `0 0 0.5em ${theme.colors.glow}`,
          },
          "&:focus": {
            boxShadow: "none",
          },
        },
        label: {
          fontWeight: "bold",
        },
        "a, label.parp": {
          color: theme.colors.accent,
        },
        "a:hover, a.hover, .hover a, label.parp:hover, label.parp.hover, .hover label.parp":
          {
            textDecoration: "underline",
            textShadow: `0 0 0.5em ${theme.colors.glow}`,
          },
        "input, input[type=text], textarea, select, option": {
          font: theme.bodyFont,
          fontVariantLigatures: "none",
          color: theme.colors.accent,
          padding: "0.1em 0.3em",
          borderStyle: "solid",
          borderWidth: "1px",
          borderColor: theme.colors.controlBorder,
          background: theme.colors.backgroundPrimary,
          resize: "vertical",
          ":focus": {
            borderColor: theme.colors.accent,
            outline: "none",
            boxShadow: `0 0 0.5em ${theme.colors.glow}`,
          },
          "&:hover": {
            borderStyle: "solid",
            borderWidth: "1px",
            borderColor: theme.colors.controlBorder,
          },
        },
        select: {
          color: theme.colors.text,
          background: theme.colors.bgOpaqueSecondary,
          option: {
            background: theme.colors.bgOpaquePrimary,
            color: theme.colors.text,
          },
          ":focus": {
            borderColor: theme.colors.accent,
            outline: "none",
            boxShadow: `0 0 0.5em ${theme.colors.glow}`,
          },
        },
        textarea: {
          lineHeight: 1,
        },
        hr: {
          borderColor: theme.colors.controlBorder,
        },
        "i.fa:last-child": {
          margin: 0,
        },
      },
      ...rootStyle,
    };

    return styles;
  }, [mode, theme]);

  // we put these styles into the `system` layer to play nice with Foundry's
  // layering system. If we left them outside of a layer they would still work,
  // but they would take priority over other like `modules` and `exceptions` which
  // are supposed to be above `system`.
  // We wouldn't need to do this if we were exporting our CSS into a file and
  // getting Foundry to load it, but see https://github.com/lumphammer/gumshoe-fvtt/issues/928
  // for why we don't do that.
  const layeredStyles = useMemo((): CSSObject => {
    return {
      "@layer system": styles,
    };
  }, [styles]);

  return (
    <ErrorBoundary>
      <EmotionCacheProvider value={cache}>
        <ThemeContext.Provider value={theme}>
          <Global styles={theme.global} />
          <div ref={ref} className={className} css={layeredStyles}>
            {children}
          </div>
        </ThemeContext.Provider>
      </EmotionCacheProvider>
    </ErrorBoundary>
  );
};

CSSReset.displayName = "CSSReset";
