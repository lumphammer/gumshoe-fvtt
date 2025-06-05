import {
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { systemLogger, wait } from "../../functions/utilities";
import { TextEditor } from "../../fvtt-exports";
import { ThemeContext } from "../../themes/ThemeContext";
import { ThemeV1 } from "../../themes/types";
import { absoluteCover } from "../absoluteCover";

type RichTextEditorProps = {
  value: string;
  className?: string;
  onSave?: () => void;
  onChange: (newSource: string) => void;
};

/** handler for making tinyMCE */
async function makeTinyMce({
  textAreaRef,
  handleSave,
  initialValue,
  onChange,
  theme,
  mceRef,
}: {
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  handleSave: () => void;
  initialValue: string;
  onChange: (newSource: string) => void;
  theme: ThemeV1;
  mceRef: { current: tinyMCE.Editor | null };
}) {
  if (!textAreaRef.current) return;
  const mce = await TextEditor.create(
    {
      target: textAreaRef.current,
      save_onsavecallback: handleSave,
      height: "100%",
    } as any,
    initialValue,
  );
  // we know it always will be an mce (until mce gets deprecated anyway)
  // but the types don't know that
  if (!(mce instanceof tinyMCE.Editor)) {
    return;
  }
  mce.on("change", () => {
    const content = mce.getContent();
    onChange(content);
  });

  // cheap hack to prevent it being times new roman
  const style = document.createElement("style");
  style.innerHTML = `
          ${typeof theme.global === "string" ? theme.global : ""}
          body {
            --font-primary: ${theme.bodyFont};
          }
        `;
  mce?.contentDocument.head.appendChild(style);

  mceRef.current = mce;
}

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
  const handleSave = useCallback(async () => {
    // hacky delay to allow the editor to update the content before we try to
    // save it. I would try harder here but we will almost certainlky end up
    // using foundry's cool new editor in due course anyway.
    await wait(500);
    onSave?.();
    systemLogger.log("saved");
  }, [onSave]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [initialValue] = useState(value);
  const theme = useContext(ThemeContext);

  useEffect(() => {
    const mceRef: { current: tinyMCE.Editor | null } = { current: null };
    void makeTinyMce({
      textAreaRef,
      handleSave,
      initialValue,
      onChange,
      theme,
      mceRef,
    });

    // effect tearddown function
    return () => {
      if (mceRef.current) {
        mceRef.current.destroy();
      }
    };
  }, [handleSave, initialValue, onChange, theme]);

  return (
    <form
      css={{
        ...absoluteCover,
        backgroundColor: "white",
        "--font-primary": theme.bodyFont,
      }}
      className={className}
    >
      <textarea ref={textAreaRef} css={{ height: "100%" }} />
    </form>
  );
};
