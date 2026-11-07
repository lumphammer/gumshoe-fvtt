import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useRef } from "react";

import { cx } from "../styled-system/css";
import { sheetRoot } from "../styled-system/recipes";
import { catalogueOverridesCss } from "../themes/catalogue/overrides";
import { paletteFromV1, paletteStyle, themeSlug } from "../themes/palette";
import { ThemeContext } from "../themes/ThemeContext";
import type { ThemeV1 } from "../themes/types";
import { claimFrame, type FrameClaim, globalCss } from "./frame";
import { EmotionPopoutCache } from "./EmotionPopoutCache";
import { ErrorBoundary } from "./ErrorBoundary";

type CSSResetProps = PropsWithChildren<{
  className?: string;
  theme: ThemeV1;
  mode: "large" | "small" | "none";
  noStyleAppWindow?: boolean;
}>;

export const CSSReset = ({
  className,
  children,
  theme,
  mode,
  noStyleAppWindow = false,
}: CSSResetProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // the root's padding and height are layout, but a V1 theme's root style
  // could set them, over the defaults: keep that
  const layout = useMemo(() => {
    const v1 =
      mode === "large"
        ? theme.largeSheetRootStyle
        : mode === "small"
          ? theme.smallSheetRootStyle
          : {};
    const px = (value: unknown) =>
      typeof value === "number" ? `${value}px` : (value as string | undefined);
    return {
      padding: px(v1.padding) ?? (mode === "none" ? "0" : "0.5em"),
      height: px(v1.height) ?? "100%",
    };
  }, [mode, theme]);

  const slug = themeSlug(theme);
  const palette = useMemo(() => paletteStyle(paletteFromV1(theme)), [theme]);

  // the window around the root, if this is the window's root: claimed once,
  // so it keeps its place among other roots in the window (frame.ts), then
  // styled with the theme, whenever that changes
  const frameClaim = useRef<FrameClaim>(undefined);
  useEffect(() => {
    if (ref.current === null || noStyleAppWindow) return;
    const claim = claimFrame(ref.current);
    frameClaim.current = claim;
    return () => {
      claim?.release();
      frameClaim.current = undefined;
    };
  }, [noStyleAppWindow]);
  useEffect(() => {
    // the palette, without colorScheme (Foundry's window has its own)
    const { colorScheme: _, ...properties } = palette;
    frameClaim.current?.update(slug, properties);
  }, [noStyleAppWindow, slug, palette]);
  // the theme's replacements for catalogue classes, as a <style> inside the
  // root, so that it goes wherever the root goes, detached windows included
  const overridesCss = useMemo(
    () =>
      theme.catalogue ? catalogueOverridesCss(slug, theme.catalogue) : null,
    [slug, theme.catalogue],
  );

  const global = useMemo(() => globalCss(theme.global), [theme.global]);

  return (
    <ErrorBoundary>
      <EmotionPopoutCache>
        <ThemeContext.Provider value={theme}>
          <div
            ref={ref}
            className={cx(sheetRoot({ size: mode }), className)}
            data-inv-theme={slug}
            style={{ ...palette, ...layout }}
          >
            {children}
            {global && <style>{global}</style>}
            {overridesCss && <style>{overridesCss}</style>}
          </div>
        </ThemeContext.Provider>
      </EmotionPopoutCache>
    </ErrorBoundary>
  );
};

CSSReset.displayName = "CSSReset";
