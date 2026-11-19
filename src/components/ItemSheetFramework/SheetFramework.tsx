import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useIsLimited } from "../../hooks/useIsEditable";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { ImagePickle } from "../ImagePickle";
import { Region } from "../Region";
import { useSettingsButton } from "../useSettingsButton";
import { ItemSheetTitle } from "./ItemSheetTitle";
import { ModeContext } from "./modeContext";
import { ItemSheetMode } from "./types";
import { css } from "../../styled-system/css";

/**
 * A framework for item sheets: the image and title (`ItemSheetTitle`), and the
 * config mode. Reads the item's name, image and permissions itself, through
 * snapshots, so it's current whether or not the sheet around it re-renders.
 */
export const ItemSheetFramework = ({ children }: PropsWithChildren) => {
  const { item, app } = useItemSheetContext();

  const img = useItemSelector(item, (snapshot) => snapshot.img);

  const [configModeChosen, setConfigMode] = useState(false);
  const isLimited = useIsLimited();
  // people with Limited permission don't get the config, even if they had
  // it open when they lost permission
  const configMode = configModeChosen && !isLimited;
  // the header's settings button (people with Limited permission don't get
  // the config)
  useSettingsButton({
    pressed: configMode,
    onToggle: () => setConfigMode((mode) => !mode),
    enabled: !isLimited,
  });

  assertApplicationV2(app);

  useEffect(() => {
    // XXX I'm sure we can do better but the types are weird right now
    // (not forced: that would bring the sheet to the front, and this can run
    // a while after it opens, by when another window may have opened)
    void app.render();
  }, [app, configMode]);

  return (
    <ModeContext.Provider
      value={configMode ? ItemSheetMode.Config : ItemSheetMode.Main}
    >
      <div
        className={css({
          paddingBottom: "1em",
          display: "grid",
          gap: "0.3em",
          height: "100%",
          position: "relative",
          gridTemplateColumns: "auto 1fr",
          gridTemplateRows: "auto 1fr",
          gridTemplateAreas: `"image title" "body body"`,
        })}
      >
        {/* Title: just below the full-frame layout's see-through titlebar
            (`--inv-titlebar-clearance`, `CSSReset`), clear of its buttons
            (the root's padding is already part of the way), while the image
            runs up under it */}
        <ItemSheetTitle
          className={css({
            gridArea: "title",
            marginTop:
              "[max(0px, calc(var(--inv-titlebar-clearance) - 0.5em))]",
          })}
        />

        {/* Image */}
        <ImagePickle
          img={img}
          className={css({
            gridArea: "image",
            // at the top of the root, under the titlebar's strip in the
            // full-frame layout, past its padding
            "--inv-image-pickle-clearance":
              "max(0px, calc(var(--inv-titlebar-clearance) - 0.5em))",
            transform: "rotateZ(-2deg)",
            // as tall as the title (and the titlebar, in the full-frame
            // layout), down to the body
            width: "6em",
            minHeight: "4em",
            margin: "0 1em 0 0",
          })}
        />

        {/* regular editing stuff, in a region: the header above is on the
            wallpaper */}
        <Region
          className={css({
            gridArea: "body",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            position: "relative",
          })}
        >
          {children}
        </Region>
      </div>
    </ModeContext.Provider>
  );
};

ItemSheetFramework.displayName = "SheetFramework";
