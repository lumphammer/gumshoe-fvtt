import { ReactNode, useCallback, useContext } from "react";

import { assertGame } from "../../functions/isGame";
import { systemLogger } from "../../functions/utilities";
import { ThemeContext } from "../../themes/ThemeContext";
import { NoteFormat } from "../../types";
import { absoluteCover } from "../absoluteCover";
import { NotesTypeContext } from "../NotesTypeContext";
import { AsyncTextArea } from "./AsyncTextArea";
import { MarkdownEditor } from "./MarkdownEditor";
import { NotesDisplay } from "./NotesDisplay";
import { RichTextEditor } from "./RichTextEditor";

interface NotesEditorProps {
  source: string;
  html: string;
  format: NoteFormat;
  onSetSource: (source: string) => Promise<void>;
  className?: string;
  editMode: boolean;
  showSource: boolean;
  onSave: () => void;
}

export const NotesEditor = ({
  source,
  html,
  format,
  onSetSource: setSource,
  className,
  editMode,
  showSource,
  onSave,
}: NotesEditorProps) => {
  assertGame(game);
  const theme = useContext(ThemeContext);

  let editor: ReactNode;

  const contentClassKey = useContext(NotesTypeContext);
  const contentClass =
    (contentClassKey ? theme.notesCssClasses?.[contentClassKey] : null) ?? "";
  const scopingContainerClass = theme.notesCssClasses?.scopingContainer ?? "";

  const toggleSecret = useCallback(
    async (index: number) => {
      systemLogger.log("Toggling secret", index);
      if (format !== "richText") {
        // we don't support secrets in md or plain
        return;
      }
      const el = document.createElement("div");
      el.innerHTML = html;
      const secret = el.querySelectorAll("section.secret")[index];
      if (secret) {
        if (secret.classList.contains("revealed")) {
          secret.classList.remove("revealed");
        } else {
          secret.classList.add("revealed");
        }
        await setSource(el.innerHTML);
        setTimeout(onSave, 100); // wait for source to update before onSave();
      }
    },
    [format, html, onSave, setSource],
  );

  if (showSource) {
    editor = (
      <pre
        css={{
          ...absoluteCover,
          overflow: "auto",
          background: theme.colors.backgroundPrimary,
          padding: "0.5em",
          border: `1px solid ${theme.colors.text}`,
        }}
      >
        {source}
        <hr />
        {html}
      </pre>
    );
  } else if (!editMode) {
    editor = (
      <div
        className={`investigator-notes-editor ${scopingContainerClass}`}
        css={{
          ...absoluteCover,
          overflow: "auto",
          ...(contentClass
            ? {}
            : { background: theme.colors.backgroundPrimary, padding: "0.5em" }),
          border: `1px solid ${theme.colors.controlBorder}`,
        }}
      >
        <NotesDisplay html={html} toggleSecret={toggleSecret} />
      </div>
    );
  } else if (format === "plain") {
    editor = (
      <AsyncTextArea
        className={className}
        onChange={setSource}
        value={source}
      />
    );
  } else if (format === "markdown") {
    editor = (
      <MarkdownEditor
        className={className}
        onChange={setSource}
        value={source}
      />
    );
  } else if (format === "richText") {
    editor = (
      <RichTextEditor
        className={className}
        value={source}
        onSave={onSave}
        onChange={setSource}
      />
    );
  }
  return (
    <div
      css={{
        ...absoluteCover,
      }}
    >
      {editor}
    </div>
  );
};
