import React, { ChangeEvent, useCallback, useContext, useRef } from "react";

import { assertGame } from "../../functions/isGame";
import { IdContext } from "../IdContext";

type TextAreaProps = {
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index?: number) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  index?: number;
};

/**
 * Slightly cheap hack - we need to insert the link text at the cursor position
 * in the textarea. Technically this textarea is controlled by react so we
 * shouldn't be manually playing with the contents (we should call onChange with
 * the updated value). But it's easier to use the textarea's own API to handle
 * inserting at the cursor, otherwise we'd have to get the cursor position and
 * do the maths ourselves. So here, I'm using the textarea to insert the text,
 * but setting it back how I found it immediately.
 */
function squirtTextIntoTextarea(
  text: string,
  textarea: HTMLTextAreaElement | null,
) {
  if (textarea === null) {
    return "";
  }
  const oldValue = textarea.value;
  textarea.setRangeText(text);
  const newValue = textarea.value;
  textarea.value = oldValue;
  return newValue;
}

/**
 * Simple synchronous <textarea> which understand's foundry's droppable link
 * magic.
 */
export const TextArea = ({
  className,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  disabled,
  placeholder,
  index,
}: TextAreaProps) => {
  const id = useContext(IdContext);

  const onChangeCb = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.currentTarget.value, index);
    },
    [index, onChange],
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // inspired by _onDropEditorData in foundry.js
  const onDropEditorData = async (
    event: React.DragEvent<HTMLTextAreaElement>,
  ) => {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    if (!data?.id) return;

    // Case 1 - Document from Compendium Pack
    if (data.pack) {
      assertGame(game);
      const pack = game.packs.get(data.pack);
      if (!pack) return;
      const document = await pack.getDocument(data.id);
      const link = `@Compendium[${data.pack}.${data.id}]{${document?.name}}`;
      onChange?.(squirtTextIntoTextarea(link, textareaRef.current), index);
    } else if (data.type) {
      // Case 2 - Document from World
      const config = CONFIG[data.type as "Actor" | "Item" | "Scene"];
      if (!config) return false;
      const entity = (config.collection as any).instance.get(data.id);
      if (!entity) return false;
      const link = `@${data.type}[${entity.data._id}]{${entity.name}}`;
      onChange?.(squirtTextIntoTextarea(link, textareaRef.current), index);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      id={id}
      css={{
        flex: 1,
        width: "100%",
        height: "100%",
      }}
      className={className}
      data-lpignore="true"
      value={value}
      defaultValue={defaultValue}
      onChange={onChangeCb}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      onDrop={(e) => onDropEditorData(e)}
    />
  );
};
