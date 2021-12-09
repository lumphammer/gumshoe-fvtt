/** @jsx jsx */
import { jsx } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { useStateWithGetter } from "../../hooks/useStateWithGetter";
import { toHtml } from "../../textFunctions";
import { NoteFormat, NoteWithFormat } from "../../types";
import { AsyncTextArea } from "./AsyncTextArea";
import { MarkdownEditor } from "./MarkdownEditor";
import { RichTextEditor } from "./RichTextEditor";

interface CompactNotesEditorProps {
  className?: string;
  note: NoteWithFormat;
  onChange: (note: NoteWithFormat) => Promise<void>;
}

/**
 * A simple editor designed to work in compact situations. No control to change
 * format. Markdowm/plain are directly editable. Rich text just renders HTML
 * until clicked, then turns into a TinyMCE.
 */
export const CompactNotesEditor: React.FC<CompactNotesEditorProps> = ({
  className,
  note,
  onChange: onSave,
}: CompactNotesEditorProps) => {
  const [liveHtml, setLiveHtml] = useState(note.html);

  const onChange = useCallback(
    async (source: string) => {
      const format = note.format;
      const html = toHtml(note.format, source);
      await onSave({
        format,
        html,
        source,
      });
      setLiveHtml(html);
    },
    [note.format, onSave],
  );

  // we do a little more work to avoid always rendering a TinyMCE for every
  // single item, which probably wouldn't scale very well.

  const [richTextEditMode, setRichTextEditMode] = useState(false);
  const [getRichTextSource, setRichTextSource] = useStateWithGetter(note.source);

  const onSaveRichText = useCallback(
    async () => {
      await onChange(getRichTextSource());
      setRichTextEditMode(false);
    },
    [getRichTextSource, onChange],
  );

  const goEditMode = useCallback(() => {
    setRichTextEditMode(true);
  }, []);

  return (
    <div
      className={className}
      css={{
        gridColumn: "2 / -1",
        whiteSpace: "normal",
        margin: "0 0 0.5em 0em",
        position: "relative",
      }}
    >
      {note.format === NoteFormat.plain && (
        <AsyncTextArea onChange={onChange} value={note.source} />
      )}
      {note.format === NoteFormat.markdown && (
        <MarkdownEditor onChange={onChange} value={note.source} />
      )}
      {note.format === NoteFormat.richText &&
        (richTextEditMode
          ? (
            <div
            css={{
              height: "12em",
            }}
            onClick={goEditMode}
          >
            <RichTextEditor
              onChange={setRichTextSource}
              onSave={onSaveRichText}
              value={note.source}
            />
          </div>
            )
          : (
          <div
            css={{
              maxHeight: "8em",
              overflow: "auto",
            }}
            onClick={goEditMode}
          >
            <div dangerouslySetInnerHTML={{ __html: liveHtml }} />
          </div>
            ))}
    </div>
  );
};
