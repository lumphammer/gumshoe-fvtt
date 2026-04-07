import { RichTextEditor } from "./RichTextEditor";

/**
 * A simple editor designed to work in compact situations. No control to change
 * format. Markdowm/plain are directly editable. Rich text just renders HTML
 * until clicked, then turns into a TinyMCE.
 */
export const CompactNotesEditor = ({
  className,
  note,
  onSave,
  name,
}: {
  className?: string;
  note: string;
  onSave: (note: string) => Promise<void>;
  name: string;
}) => {
  // we do a little more work to avoid always rendering a TinyMCE for every
  // single item, which probably wouldn't scale very well.

  return (
    <div
      className={className}
      css={{
        whiteSpace: "normal",
        position: "relative",
      }}
    >
      <div
        css={{
          height: "12em",
        }}
      >
        <RichTextEditor name={name} className="" onSave={onSave} html={note} />
      </div>
    </div>
  );
};
