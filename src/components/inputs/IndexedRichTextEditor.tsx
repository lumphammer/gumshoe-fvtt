import { useCallback } from "react";

import { RichTextEditor } from "./RichTextEditor";

export const IndexedRichTextEditor = ({
  index,
  onSave,
  className,
  html,
  name,
}: {
  index: number;
  onSave: (note: string, index: number) => void;
  className?: string;
  documentUUID?: string;
  html: string;
  name: string;
}) => {
  const handleSave = useCallback(
    (note: string) => {
      onSave(note, index);
    },
    [index, onSave],
  );
  return (
    <RichTextEditor
      name={name}
      onSave={handleSave}
      className={className}
      html={html}
    />
  );
};

IndexedRichTextEditor.displayName = "IndexedNotesEditorWithControls";
