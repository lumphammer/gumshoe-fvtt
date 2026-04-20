import { useContext, useEffect, useRef, useState } from "react";

import { cleanAndEnrichHtml } from "../../functions/textFunctions";
import { systemLogger } from "../../functions/utilities";
import { useDocumentSheetContext } from "../../hooks/useSheetContexts";
import { ThemeContext } from "../../themes/ThemeContext";

/**
 * React wrapper around fvtt's HTMLProseMirrorElement
 * @param param0
 * @returns
 */
export const RichTextEditor = ({
  className = "",
  html,
  onSave,
  name,
}: {
  /** optional class */
  className?: string;
  /** html string */
  html: string;
  /** callback for saving */
  onSave: (html: string) => void;
  /**
   * identifier for collaborative editing. used for matchmaking when multiple
   * people are in edit mode. It doesn't technically matter what the name is, as
   * long as everyone editing the same content is using the same name. the best
   * idea is to use the field name, i.e. "notes".
   */
  name: string;
}) => {
  const { doc } = useDocumentSheetContext();

  const divRef = useRef<HTMLDivElement>(null);
  const theme = useContext(ThemeContext);

  // enriching HTML is async for some reason, so we need to treat it like a data
  // fetch and set a piece of state for it. We also stash it in a ref so editor
  // instances can read it even if they have closed over a stale value of
  // `enriched`.
  const [enriched, setEnriched] = useState("");
  const enrichedRef = useRef(enriched);
  useEffect(() => {
    void cleanAndEnrichHtml(html).then((enriched) => {
      setEnriched(enriched);
      enrichedRef.current = enriched;
    });
  }, [html]);

  // this effect creates the actual HTMLProseMirrorElement instance and shoves
  // it into the DOM.
  useEffect(() => {
    // drop out if there's already an open editor here -  see [1]
    const child = divRef.current?.getElementsByTagName("prose-mirror").item(0);
    if (
      child instanceof foundry.applications.elements.HTMLProseMirrorElement &&
      child.open
    ) {
      systemLogger.log("editor still present, not creating a new one");
      return;
    } else {
      child?.remove();
    }
    // borrowed lovingly from
    // https://github.com/asacolips-projects/13th-age/blob/acd49c1d8b1eaf63f544c1d2e5a4aa1a74742c9e/src/module/item/power-sheet-v2.js#L148
    const editor = foundry.applications.elements.HTMLProseMirrorElement.create({
      toggled: true,
      collaborate: true,
      documentUUID: doc.uuid ?? undefined,
      enriched,
      name,
      value: html,
    });
    // set up the save callback
    editor.addEventListener("save", () => {
      // do the actual save
      onSave(editor.value);
      // [2] HTMLProseMirrorElement has no way to update the HTML once it's
      // mounted, so we need to queue up a task to update it by hand from the
      // ref now.
      setTimeout(() => {
        const contentElement = editor
          .getElementsByClassName("editor-content")
          .item(0);
        if (contentElement) {
          systemLogger.log("updating editor content", enrichedRef.current);
          contentElement.innerHTML = enrichedRef.current;
        }
      }, 0);
    });
    // attach to DOM
    divRef.current?.appendChild(editor);

    const div = divRef.current;
    // teardown function
    return () => {
      // [1] if the editor is open, we do not remove it just because the HTML
      // has updated. This is because 1. It's super annoying to have your
      // editing session ended because some *else* saved, and 2. while we're in
      // edit mode, collaborative editing will keep the display up to date.
      // However, see [2].
      if (editor.open) {
        systemLogger.log("editor open, not removing");
      } else {
        systemLogger.log("removing editor");
        editor.remove();
        if (div) {
          div.innerHTML = "";
        }
      }
    };
  }, [doc.uuid, enriched, html, name, onSave]);

  return (
    <div
      ref={divRef}
      css={{
        backgroundColor: theme.colors.backgroundPrimary,
        border: `1px solid ${theme.colors.controlBorder}`,
        position: "absolute",
        inset: "0px",
        ".prosemirror": {
          position: "absolute",
          inset: "0.5em",
          "button.icon.toggle": {
            position: "absolute",
            top: "0px",
            right: "0px",
            width: "2em",
            height: "2em",
          },
          ".menu-container": {
            flexBasis: "min-content",
            menu: {
              position: "static",
              backgroundColor: "transparent",
              padding: 0,
            },
          },
        },
      }}
      className={`${className} `}
    ></div>
  );
};
