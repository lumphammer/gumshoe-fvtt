import createCache from "@emotion/cache";
import { css } from "@emotion/css";
import { CacheProvider as EmotionCacheProvider, Global } from "@emotion/react";
import React, {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ThemeContext } from "../themes/ThemeContext";
import { ThemeV1 } from "../themes/types";
import { ErrorBoundary } from "./ErrorBoundary";
import { FoundryAppContext } from "./FoundryAppContext";

type CSSResetProps = {
  children: ReactNode;
  className?: string;
  theme: ThemeV1;
  mode: "large" | "small";
  noStyleAppWindow?: boolean;
};

export const CSSReset: React.FC<CSSResetProps> = ({
  className,
  children,
  theme,
  mode,
  noStyleAppWindow = false,
}: CSSResetProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // add app window styles if there's a continaing app window
  useEffect(() => {
    // interacting with Foundry's stuff with jQuery feels a bit 2001 but putting
    // it in a hook keeps is nice and encapsulated.
    // @ts-expect-error mismatch between CSSObject types between emotion/react and emotion/css?
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

  const [head, setHead] = useState(app?.element.get(0)?.closest("head"));

  useEffect(() => {
    const popoutHandler = (poppedApp: Application, newWindow: Window) => {
      if (poppedApp.appId === app?.appId) {
        setHead(newWindow.document.head);
      }
    };
    const dialogHandler = (
      dialoggedApp: Application,
      info: PopOut.DialogHookInfo,
    ) => {
      if (dialoggedApp.appId === app?.appId) {
        setHead(info.window.document.head);
      }
    };
    Hooks.on("PopOut:popout", popoutHandler);
    Hooks.on("PopOut:dialog", dialogHandler);
    return () => {
      Hooks.off("PopOut:popout", popoutHandler);
      Hooks.off("PopOut:dialog", dialogHandler);
    };
  }, [app?.appId]);

  const cache = useMemo(() => {
    return createCache({
      key: "investigator",
      container: head ?? undefined,
    });
  }, [head]);

  const rootStyle =
    mode === "large" ? theme.largeSheetRootStyle : theme.smallSheetRootStyle;

  return (
    <ErrorBoundary>
      <EmotionCacheProvider value={cache}>
        <ThemeContext.Provider value={theme}>
          <Global styles={theme.global} />
          <div
            ref={ref}
            className={className}
            css={{
              font: theme.bodyFont,
              padding: "0.5em",
              color: theme.colors.text,
              backgroundColor: theme.colors.wallpaper,
              height: "100%",
              accentColor: theme.colors.accent,
              "*": {
                // all: "initial",
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
              button: {
                font: theme.displayFont,
                color: theme.colors.accent,
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
                font: theme.displayFont,
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
              "button, input[type=button]": {
                border: `2px groove ${theme.colors.controlBorder}`,
                background: theme.colors.backgroundButton,
              },
              hr: {
                borderColor: theme.colors.controlBorder,
              },
              "i.fa:last-child": {
                margin: 0,
              },
              ...rootStyle,
            }}
          >
            {children}
          </div>
        </ThemeContext.Provider>
      </EmotionCacheProvider>
    </ErrorBoundary>
  );
};
