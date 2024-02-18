import React, { ReactNode, useContext } from "react";

import { assertGame } from "../../functions/utilities";
import { ThemeContext } from "../../themes/ThemeContext";
import { NoteFormat } from "../../types";
import { absoluteCover } from "../absoluteCover";
import { NotesTypeContext } from "../NotesTypeContext";
import { AsyncTextArea } from "./AsyncTextArea";
import { MarkdownEditor } from "./MarkdownEditor";
import { RichTextEditor } from "./RichTextEditor";

interface NotesEditorProps {
  source: string;
  html: string;
  format: NoteFormat;
  setSource: (source: string) => void;
  className?: string;
  editMode: boolean;
  showSource: boolean;
  onSave: () => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  source,
  html,
  format,
  setSource,
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
        <div
          className={contentClass}
          css={{
            minHeight: "100%",
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  } else if (format === NoteFormat.plain) {
    editor = (
      <AsyncTextArea
        className={className}
        onChange={setSource}
        value={source}
      />
    );
  } else if (format === NoteFormat.markdown) {
    editor = (
      <MarkdownEditor
        className={className}
        onChange={setSource}
        value={source}
      />
    );
  } else if (format === NoteFormat.richText) {
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
