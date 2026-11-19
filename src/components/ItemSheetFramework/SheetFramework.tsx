import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useState } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useIsEditable } from "../../hooks/useIsEditable";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useIsLimited } from "../../hooks/useIsEditable";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { ImagePickle } from "../ImagePickle";
import { Region } from "../Region";
import { useSettingsButton } from "../useSettingsButton";
import { ModeContext } from "./modeContext";
import { ItemSheetMode } from "./types";
import { css } from "../../styled-system/css";

type ItemSheetFrameworkProps = PropsWithChildren<{
  supertitle?: ReactNode;
}>;

/**
 * A framework for item sheets. Reads the item's name, image and permissions
 * itself, through snapshots, so it's current whether or not the sheet around
 * it re-renders.
 */
export const ItemSheetFramework = ({
  supertitle,
  children,
}: ItemSheetFrameworkProps) => {
  const { item, app } = useItemSheetContext();

  const header = useItemSelector(item, (snapshot) => ({
    name: snapshot.name,
    img: snapshot.img,
  }));
  const { contentEditableRef, onBlur, onFocus, onInput, onKeyDown, onPaste } =
    useAsyncUpdate(header.name, item.setName);

  const [configMode, setConfigMode] = useState(false);
  const isLimited = useIsLimited();
  const isEditable = useIsEditable();
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
          gridTemplateRows: "auto auto 1fr",
          gridTemplateAreas: `"image slug" "image headline" "body body"`,
          // just below the full-frame layout's see-through titlebar
          // (`--inv-titlebar-clearance`, `ItemSheet`), clear of its buttons:
          // the root's padding is already part of the way
          paddingTop: "[max(0px, calc(var(--inv-titlebar-clearance) - 0.5em))]",
        })}
      >
        {/* Supertitle */}
        <div className={css({ gridArea: "slug" })}>{supertitle}</div>

        {/* Headline */}
        <h1 className={css({ gridArea: "headline" })}>
          <span
            contentEditable={isEditable}
            className={css({
              minWidth: "1em",
              display: "inline-block",
            })}
            ref={contentEditableRef}
            onInput={onInput}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={onBlur}
            onFocus={onFocus}
          />
        </h1>

        {/* Image */}
        <ImagePickle
          img={header.img}
          className={css({
            gridArea: "image",
            transform: "rotateZ(-2deg)",
            width: "4em",
            height: "4em",
            margin: "0 1em 0.5em 0",
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
