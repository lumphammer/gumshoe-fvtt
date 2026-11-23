import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type { PropsWithChildren } from "react";
import React, { useContext } from "react";

import { ActorSheetV2, ItemSheetV2 } from "../fvtt-exports";
import { useActorTheme } from "../hooks/useActorTheme";
import type { SheetKind } from "../themes/theme";
import { absoluteCover } from "./absoluteCover";
import { CSSReset } from "./CSSReset";
import { region } from "../styled-system/recipes";
import { css, cx } from "../styled-system/css";

/**
 * The actor whose theme the window's sheet will have: an actor sheet's
 * actor, or an item sheet's item's (none for other windows, which have the
 * default theme).
 */
const useWindowActor = () => {
  const app = useContext(FoundryAppContext);
  if (app instanceof ActorSheetV2) return app.actor;
  if (app instanceof ItemSheetV2) return app.item.actor;
  return null;
};

/**
 * The spinner while a sheet loads: the sheet's root, as it will be (its
 * theme and kind), so the window doesn't change look when the sheet arrives.
 */
const Fallback = ({ sheet }: { sheet: SheetKind }) => {
  const theme = useActorTheme(useWindowActor());
  return (
    <CSSReset
      theme={theme}
      sheet={sheet}
      // so a full-frame sheet's titlebar is see-through from the start, not
      // only once it's loaded (the spinner's in the middle, clear of it)
      clearsTitlebar
      className={css(absoluteCover)}
    >
      {/* in a region, as nothing but regions (and tabs, the portrait and
          the logo) is promised to read on a character sheet's wallpaper */}
      <div
        className={cx(
          region(),
          css({
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "3em",
            lineHeight: "1",
          }),
        )}
      >
        <i className="fas fa-spinner fa-spin" />
      </div>
    </CSSReset>
  );
};

/** A lazy sheet, with a spinner in the sheet's own look while it loads. */
export const Suspense = ({
  sheet,
  children,
}: PropsWithChildren<{ sheet: SheetKind }>) => (
  <React.Suspense fallback={<Fallback sheet={sheet} />}>
    {children}
  </React.Suspense>
);
