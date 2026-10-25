import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { inputThrottleTime } from "../constants";
import { throttle } from "../functions/utilities";

/** Join lines with spaces. */
const toSingleLine = (text: string) => text.replace(/\s*[\r\n]+\s*/g, " ");

/**
 * An element's text with its line breaks. Not innerText, which would also
 * pick up CSS text-transform.
 */
const textWithLineBreaks = (element: HTMLElement) => {
  const clone = element.cloneNode(true) as HTMLElement;
  for (const br of clone.querySelectorAll("br")) br.replaceWith("\n");
  for (const block of clone.querySelectorAll("div, p, li")) {
    block.before("\n");
    block.after("\n");
  }
  return clone.textContent;
};

const placeCaretAtEnd = (element: HTMLElement) => {
  const selection = element.ownerDocument.getSelection();
  if (!selection) return;
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

/** Put text in place of the selection, if it's in the element. */
const insertAtSelection = (element: HTMLElement, text: string) => {
  const selection = element.ownerDocument.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return;
  range.deleteContents();
  const node = element.ownerDocument.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
};

/**
 * Hook for handling async updates, e,g, where you want to be calling an
 * external onChange every so often but you can't be relying on it updating
 * fast enough to handle your react state.
 */
export const useAsyncUpdate = (
  value: string,
  onChangeOrig: (newValue: string) => void,
) => {
  // many shenanigans to handle slow updates
  // first up, state to handle the actual text we show so we can update it in a
  // timely fashion
  const [display, setDisplay] = useState(value || "");
  // state to track focus
  const focusedRef = useRef(false);

  // callback for focus
  const onFocus = useCallback(() => {
    focusedRef.current = true;
  }, []);

  // we only fire the update event every so often to avoid spamming the
  // network
  const onChangeThrottled = useMemo(() => {
    return throttle(onChangeOrig, inputThrottleTime);
  }, [onChangeOrig]);

  // callback for blur. Save any change that's waiting, so it's in before
  // whatever took the focus (e.g. a Save button) acts
  const onBlur = useCallback(() => {
    focusedRef.current = false;
    onChangeThrottled.flush();
  }, [onChangeThrottled]);

  // and don't lose a waiting change when the input goes away, or stops using
  // this callback
  useEffect(() => () => onChangeThrottled.flush(), [onChangeThrottled]);

  const onChange = useCallback(
    (value: string) => {
      setDisplay(value);
      onChangeThrottled(value);
    },
    [onChangeThrottled],
  );

  // stuff for handling content-editable - first, a ref to attach to the element
  const contentEditableRef = useRef<HTMLDivElement | null>(null);

  // a callback for when edits happen. Use textContent, not innerText:
  // innerText is the rendered text, so it picks up any CSS text-transform
  // (e.g. a theme with uppercase titles) and we would save that instead
  const onInput = useCallback(
    (e: React.InputEvent<HTMLInputElement>) => {
      const element = e.currentTarget;
      // these are single-line. If something got a line break or markup in
      // anyway (e.g. text dragged in), flatten it back to one line of text
      if (element.childElementCount > 0 || /[\r\n]/.test(element.textContent)) {
        element.textContent = toSingleLine(textWithLineBreaks(element)).trim();
        placeCaretAtEnd(element);
      }
      onChange(element.textContent);
    },
    [onChange],
  );

  // Enter finishes the edit rather than adding a line (unless it's confirming
  // an IME composition)
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, []);

  // paste as plain text, on one line
  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLElement>) => {
      e.preventDefault();
      const element = e.currentTarget;
      const text = toSingleLine(e.clipboardData.getData("text/plain"));
      // insertText is deprecated, but it's still the only way to edit that
      // the browser can undo. It fires input, which saves
      // eslint-disable-next-line typescript/no-deprecated -- nothing replaces it
      if (!element.ownerDocument.execCommand("insertText", false, text)) {
        insertAtSelection(element, text);
        onChange(element.textContent);
      }
    },
    [onChange],
  );

  // update the display text when the value changes, but only if we're not
  // focused.
  useEffect(() => {
    if (!focusedRef.current) {
      setDisplay(value);
      if (contentEditableRef.current) {
        contentEditableRef.current.textContent = value;
      }
    }
  }, [value]);

  return {
    onChange,
    onFocus,
    onBlur,
    display,

    contentEditableRef,
    onInput,
    onKeyDown,
    onPaste,
  };
};

// for posterity, i'm leaving this here - a mechanism to relay the text
// through a secondary div to avoid having the text affected by
// text-transform: uppercase on the element. We've fixed that differently by
// using font-variant: small-caps but it might be handy in future.

// const repeaterDivRef = useRef<HTMLDivElement|null>(null);
// useEffect(() => {
//   repeaterDivRef.current = document.createElement("div");
//   document.body.appendChild(repeaterDivRef.current);
// }, []);
