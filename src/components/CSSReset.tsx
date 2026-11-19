import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useRef } from "react";

import { css, cx } from "../styled-system/css";
import { sheetRoot } from "../styled-system/recipes";
import { themeCss } from "../themes/catalogue/themeCss";
import { paletteStyle, themeSlug } from "../themes/palette";
import type { Theme } from "../themes/theme";
import { claimFrame, type FrameClaim } from "./frame";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * In the full-frame layout, the logo's text stays below the see-through
 * titlebar, by shrinking down by the same distance the titlebar overlaps the
 * logo (measured by `LogoEditable`), minus `--inv-logo-strip-tuck`, which is
 * "how far the text can start inside the strip". This lets it sit a little
 * higher, more centred between the top of the window and the fields, at the
 * cost of a sliver of the name being under the titlebar (a press there drags
 * the window).
 */
const logoTuning = css({
  "--inv-logo-strip-tuck": "15px",
});

/**
 * `--inv-titlebar-clearance`, for a root which `clearsTitlebar`: how far the
 * window's titlebar reaches down over it. In the full-frame layout it's a
 * see-through strip over the top of it (`appFrame`), and the sheet starts
 * just below it, instead of below it and its usual padding too. Otherwise
 * the titlebar is above the sheet, so 0.
 */
const titlebarClearance = css({
  "--inv-titlebar-clearance": "0px",
  "&[data-inv-layout=full-frame]": {
    "--inv-titlebar-clearance": "var(--header-height)",
  },
});

type CSSResetProps = PropsWithChildren<{
  className?: string;
  theme: Theme;
  mode: "large" | "small" | "none";
  noStyleAppWindow?: boolean;
  /**
   * The content leaves room for the full-frame layout's see-through titlebar
   * itself (`appFrame`), as the item and party sheets and the
   * settings do, through
   * `--inv-titlebar-clearance` (`titlebarClearance`). (The PC and NPC sheets'
   * logos say so themselves.)
   */
  clearsTitlebar?: boolean;
}>;

export const CSSReset = ({
  className,
  children,
  theme,
  mode,
  noStyleAppWindow = false,
  clearsTitlebar = false,
}: CSSResetProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const slug = themeSlug(theme);
  const layout = theme.layout ?? "standard";
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
    frameClaim.current?.update(slug, properties, layout);
  }, [noStyleAppWindow, slug, palette, layout]);
  // the theme's overrides of catalogue classes, as a <style> inside the
  // root: its rules are scoped to the root by being there (themeCss), and it
  // goes wherever the root goes, detached windows included
  const overridesCss = themeCss(theme);

  return (
    <ErrorBoundary>
      <div
        ref={ref}
        className={cx(
          sheetRoot({ size: mode }),
          logoTuning,
          clearsTitlebar && titlebarClearance,
          className,
        )}
        data-inv-theme={slug}
        // for the sheets' grids, which follow it
        data-inv-layout={layout}
        data-inv-clears-titlebar={clearsTitlebar || undefined}
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
