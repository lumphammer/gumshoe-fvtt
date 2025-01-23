import { useCallback, useEffect, useRef, useState } from "react";

import { wait } from "../../functions/utilities";
import { absoluteCover } from "../absoluteCover";
type RichTextEditorProps = {
  value: string;
  className?: string;
  onSave?: () => void;
  onChange: (newSource: string) => void;
};

/**
 * ham-fisted attempt to cram Foundry's TextEditor, which is itself a wrapper
 * around TnyMCE, into a React component. It follows the same pattern as other
 * reacty controls in that it triggers onChange whenever the user types, and
 * calls onSave if they click the save button.
 */
export const RichTextEditor = ({
  value,
  className,
  onSave,
  onChange,
}: RichTextEditorProps) => {
  // useWhyDidYouUpdate("RichTextEditor", {
  //   value,
  //   className,
  //   onSave,
  //   onChange,
  // });

  const handleSave = useCallback(async () => {
    // hacky delay to allow the editor to update the content before we try to
    // save it. I would try harder here but we will almost certainlky end up
    // using foundry's cool new editor in due course anyway.
    await wait(500);
    onSave?.();
  }, [onSave]);

  const ref = useRef<HTMLTextAreaElement>(null);
  const [initialValue] = useState(value);

  useEffect(() => {
    let tinyMceEditor: tinyMCE.Editor | null = null;
    if (ref.current) {
      void TextEditor.create(
        {
          target: ref.current,
          save_onsavecallback: handleSave,
          height: "100%",
        } as any,
        initialValue,
      ).then((mce) => {
        // we know it always will be an mce (until mce gets deprecated anyway)
        // but the types don't know that
        if (!(mce instanceof tinyMCE.Editor)) {
          return;
        }
        mce.on("change", () => {
          const content = mce.getContent();
          onChange(content);
        });
        tinyMceEditor = mce;
      });

      // effect tearddown function
      return () => {
        if (tinyMceEditor) {
          tinyMceEditor.destroy();
        }
      };
    }
  }, [initialValue, handleSave, onChange]);

  return (
    <form
      css={{
        ...absoluteCover,
        backgroundColor: "white",
      }}
      className={className}
    >
      <textarea ref={ref} css={{ height: "100%" }} />
    </form>
  );
};
