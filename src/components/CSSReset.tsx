import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useRef } from "react";

import { css, cx } from "../styled-system/css";
import { sheetRoot } from "../styled-system/recipes";
import { catalogueOverridesCss } from "../themes/catalogue/overrides";
import { paletteStyle, themeSlug } from "../themes/palette";
import type { Theme } from "../themes/theme";
import { claimFrame, type FrameClaim } from "./frame";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * What the layout means for what's inside this root (and not inside another
 * root in it): in the full-frame layout, how far the logo's text keeps in
 * from each side, clear of the window's buttons (`frame.ts` measures them).
 * Not in a detached window, which keeps the standard titlebar.
 */
const layoutVars = css({
  "--inv-logo-inset": "0px",
  "&[data-inv-layout=full-frame]": {
    "--inv-logo-inset": "var(--inv-window-controls-width, 0px)",
  },
  "body.detached &": { "--inv-logo-inset": "0px" },
});

type CSSResetProps = PropsWithChildren<{
  className?: string;
  theme: Theme;
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

  const slug = themeSlug(theme);
  const palette = useMemo(() => paletteStyle(theme.palette), [theme]);

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
    frameClaim.current?.update(slug, properties, theme.layout);
  }, [noStyleAppWindow, slug, palette, theme.layout]);
  // the theme's replacements for catalogue classes, as a <style> inside the
  // root, so that it goes wherever the root goes, detached windows included
  const overridesCss = useMemo(
    () => catalogueOverridesCss(slug, theme.catalogue),
    [slug, theme.catalogue],
  );

  return (
    <ErrorBoundary>
      <div
        ref={ref}
        className={cx(sheetRoot({ size: mode }), layoutVars, className)}
        data-inv-theme={slug}
        // for the sheets' grids, which follow it
        data-inv-layout={theme.layout}
        style={palette}
      >
        {children}
        {theme.globalCss && <style>{theme.globalCss}</style>}
        {overridesCss && <style>{overridesCss}</style>}
      </div>
    </ErrorBoundary>
  );
};

CSSReset.displayName = "CSSReset";
