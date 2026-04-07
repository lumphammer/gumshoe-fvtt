import { useEffect, useRef, useState } from "react";

import { cleanAndEnrichHtml } from "../../functions/textFunctions";
import { useDocumentSheetContext } from "../../hooks/useSheetContexts";
import { useTheme } from "../../hooks/useTheme";

export const RichTextEditor = ({
  className = "",
  html,
  onSave,
  name,
}: {
  className?: string;
  html: string;
  onSave: (html: string) => void;
  name: string;
}) => {
  const { doc } = useDocumentSheetContext();

  // const [html, setHtml] = createSignal(props.initialHtml);
  const divRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [enriched, setEnriched] = useState("");

  useEffect(() => {
    void cleanAndEnrichHtml(html).then((enriched) => {
      setEnriched(enriched);
    });
  }, [html]);

  useEffect(() => {
    if ((divRef.current?.childElementCount ?? 0) > 0) {
      console.log("editor still present, not creating a new one");
      return;
    }
    // borrowed lovingly from https://github.com/asacolips-projects/13th-age/blob/acd49c1d8b1eaf63f544c1d2e5a4aa1a74742c9e/src/module/item/power-sheet-v2.js#L148
    const editor = foundry.applications.elements.HTMLProseMirrorElement.create({
      toggled: true,
      collaborate: true,
      documentUUID: doc.uuid,
      enriched,
      // enriched: html,
      // compact: true,
      name,
      value: html,
    });
    editor.addEventListener("save", () => {
      // const strippedHTML = stripStyleAttributes(editor.value);
      onSave(editor.value);
    });
    console.log("mounting");
    divRef.current?.appendChild(editor);
    return () => {
      if (editor.open) {
        console.log("editor open, not removing");
      } else {
        console.log("removing");
        editor.remove();
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
