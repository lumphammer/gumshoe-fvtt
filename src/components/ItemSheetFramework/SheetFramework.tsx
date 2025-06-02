import { PropsWithChildren, ReactNode, useEffect, useState } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { ImagePickle } from "../ImagePickle";
import { ModeContext } from "./modeContext";
import { ItemSheetMode } from "./types";

type ItemSheetFrameworkProps = PropsWithChildren<{
  supertitle?: ReactNode;
}>;

/**
 * A framework for item sheets.
 */
export const ItemSheetFramework = ({
  supertitle,
  children,
}: ItemSheetFrameworkProps) => {
  const { item, app } = useItemSheetContext();

  const { contentEditableRef, onBlur, onFocus, onInput } = useAsyncUpdate(
    item.name ?? "",
    item.setName,
  );

  const [configMode, setConfigMode] = useState(false);

  assertApplicationV2(app);

  useEffect(() => {
    // XXX I'm sure we can do better but the types are weird right now
    void app.render({ force: true });
  }, [app, configMode]);

  return (
    <ModeContext.Provider
      value={configMode ? ItemSheetMode.Config : ItemSheetMode.Main}
    >
      <div
        css={{
          paddingBottom: "1em",
          display: "grid",
          gap: "0.3em",
          height: "100%",
          position: "relative",
          gridTemplateColumns: "auto 1fr auto",
          gridTemplateRows: "auto auto 1fr",
          gridTemplateAreas:
            '"image slug     cog" ' +
            '"image headline headline" ' +
            '"body  body     body" ',
        }}
      >
        {/* Supertitle */}
        <div css={{ gridArea: "slug" }}>{supertitle}</div>

        {/* Headline */}
        <h1 css={{ gridArea: "headline" }}>
          <span
            contentEditable
            css={{
              minWidth: "1em",
              display: "inline-block",
            }}
            ref={contentEditableRef}
            onInput={onInput}
            onBlur={onBlur}
            onFocus={onFocus}
          />
        </h1>

        {/* Image */}
        <ImagePickle
          css={{
            gridArea: "image",
            transform: "rotateZ(-2deg)",
            width: "4em",
            height: "4em",
            margin: "0 1em 0.5em 0",
          }}
        />

        {/* Cog */}
        <a
          css={{
            gridArea: "cog",
          }}
          onClick={() => {
            setConfigMode((mode) => !mode);
          }}
        >
          <i className={`fa fa-${configMode ? "check" : "cog"}`} />
        </a>
        {/* regular editing stuff */}
        <div
          css={{
            gridArea: "body",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            position: "relative",
          }}
        >
          {children}
        </div>
      </div>
    </ModeContext.Provider>
  );
};

ItemSheetFramework.displayName = "SheetFramework";
