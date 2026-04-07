import { useEffect, useRef } from "react";

import { useTheme } from "../../hooks/useTheme";

// import styles from "./richText.module.css";

export function stripStyleAttributes(html: string) {
  const element = document.createElement("div");
  element.innerHTML = html;
  const styledElements = element.querySelectorAll("[style],[class]");
  styledElements.forEach((styledElement) => {
    styledElement.removeAttribute("style");
    styledElement.removeAttribute("class");
  });
  return element.innerHTML;
}

export const RichTextEditor = ({
  className = "",
  documentUUID,
  html,
  onSave,
}: {
  className?: string;
  documentUUID?: string;
  html: string;
  onSave: (html: string) => void;
}) => {
  // const [html, setHtml] = createSignal(props.initialHtml);
  const divRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    // borrowed lovingly from https://github.com/asacolips-projects/13th-age/blob/acd49c1d8b1eaf63f544c1d2e5a4aa1a74742c9e/src/module/item/power-sheet-v2.js#L148
    const editor = foundry.applications.elements.HTMLProseMirrorElement.create({
      toggled: true,
      // collaborate: true,
      documentUUID: documentUUID,
      enriched: html,
      compact: true,
      name: "system.text",
      value: html,
    });
    editor.addEventListener("save", () => {
      console.log("change", editor.value);
      const strippedHTML = stripStyleAttributes(editor.value);
      console.log("strippedHTML", strippedHTML);
      onSave(strippedHTML);
    });
    divRef.current?.appendChild(editor);
    const div = divRef.current;
    return () => {
      div?.removeChild(editor);
      editor.remove();
    };
  }, [documentUUID, html, onSave]);

  return (
    <div
      ref={divRef}
      // className={`absolute inset-0 my-2 ${styles["rich-text-editor"]}`}
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
          ".menu-container menu": {
            backgroundColor: "transparent",
          },
        },
      }}
      className={`${className} `}
    />
  );
};
