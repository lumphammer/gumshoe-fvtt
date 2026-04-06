import { useCallback } from "react";

import { RichTextEditor } from "./RichTextEditor";

export const IndexedNotesEditorWithControls = ({
  index,
  onSave,
  className,
  documentUUID,
  html,
}: {
  index: number;
  onSave: (note: string, index: number) => void;
  className?: string;
  documentUUID?: string;
  html: string;
}) => {
  const handleSave = useCallback(
    (note: string) => {
      onSave(note, index);
    },
    [index, onSave],
  );
  return (
    <RichTextEditor
      onSave={handleSave}
      className={className}
      documentUUID={documentUUID}
      html={html}
    />
  );
};

IndexedNotesEditorWithControls.displayName = "IndexedNotesEditorWithControls";
