import { useCallback, useEffect, useRef, useState } from "react";

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
 * How long to wait for a save before giving up on hearing back, so a lost
 * reply can't leave an input ignoring the server for good.
 */
const saveTimeout = 10_000;

type Save = (newValue: string) => void | PromiseLike<unknown>;

type UseAsyncUpdateOptions = {
  /**
   * The value can't be blank (e.g. a document's name, which Foundry refuses
   * to save empty). Blank text is shown but never saved, so the field can be
   * cleared to type something else; if it's still blank when the edit ends,
   * it goes back to (and saves) what it was when the edit began, rather than
   * whatever part-deleted text was last saved on the way.
   */
  required?: boolean;
};

const isBlank = (text: string) => text.trim() === "";

/**
 * Throttles saves (see `throttle`), sends them one at a time, and keeps track
 * of whether any are still to do.
 *
 * One at a time because Foundry compares an update with its copy of the
 * document, which doesn't change until a save comes back: after + then -
 * quickly, the - would match the old value, be dropped as no change, and the
 * + would win. So a save made while one is out waits for it (only the newest
 * waits).
 *
 * Each change is saved with the function given with it, so a change made
 * before the input moved to another document still goes to the first.
 *
 * A save is out until the promise it returns settles (if it returns none, it's
 * done straight away). `onIdle` is called when there's nothing left to do.
 */
const createThrottledSaver = (period: number, onIdle: () => void) => {
  let waiting = false;
  let sending = false;
  let queued: { value: string; save: Save } | null = null;

  const send = (value: string, save: Save) => {
    sending = true;
    let done = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      sending = false;
      if (queued) {
        const next = queued;
        queued = null;
        send(next.value, next.save);
      } else if (!waiting) {
        onIdle();
      }
    };
    let result: void | PromiseLike<unknown>;
    try {
      result = save(value);
    } catch (e) {
      finish();
      throw e;
    }
    if (result && typeof result.then === "function") {
      timeout = setTimeout(finish, saveTimeout);
      result.then(finish, finish);
    } else {
      finish();
    }
  };

  const throttled = throttle((value: string, save: Save) => {
    waiting = false;
    if (sending) {
      queued = { value, save };
    } else {
      send(value, save);
    }
  }, period);

  return {
    save: (value: string, save: Save) => {
      waiting = true;
      throttled(value, save);
    },
    /** send a waiting change now (or as soon as the one out is back) */
    flush: () => throttled.flush(),
    isBusy: () => waiting || sending || queued !== null,
  };
};

/**
 * Hook for handling async updates, e,g, where you want to be calling an
 * external onChange every so often but you can't be relying on it updating
 * fast enough to handle your react state.
 *
 * What's shown is the local value while there's any change of ours not yet
 * saved: one waiting in the throttle, or a save not yet finished (when
 * `onChange` returns a promise). Values coming in meanwhile are echoes of our
 * own earlier saves, and showing them would make the number bounce, and lose
 * changes (+ adds to what's shown). Once everything's saved, it shows `value`
 * again, so a save the server clamped or refused shows what was stored.
 */
export const useAsyncUpdate = (
  value: string,
  onChangeOrig: Save,
  { required = false }: UseAsyncUpdateOptions = {},
) => {
  // the text we show, updated straight away
  const [display, setDisplayState] = useState(value || "");
  // the same, readable from callbacks without depending on it
  const displayRef = useRef(display);
  const setDisplay = useCallback((text: string) => {
    displayRef.current = text;
    setDisplayState(text);
  }, []);
  // while focused, incoming values never replace what's being typed
  const focusedRef = useRef(false);
  // what was shown when the current edit began (for `required`)
  const editStartRef = useRef<string | null>(null);
  // the latest save function, for ending an edit from a cleanup
  const saveRef = useRef(onChangeOrig);
  useEffect(() => {
    saveRef.current = onChangeOrig;
  }, [onChangeOrig]);
  // bumped when the saves are all done, to show `value` again
  const [settledCount, setSettledCount] = useState(0);

  // callback for focus
  const onFocus = useCallback(() => {
    focusedRef.current = true;
    editStartRef.current = displayRef.current;
  }, []);

  // we only fire the update event every so often to avoid spamming the
  // network. One for the input's lifetime, even if the callback changes (e.g.
  // a new one each render): a new one would forget the saves still out
  const [saver] = useState(() =>
    createThrottledSaver(inputThrottleTime, () => {
      setSettledCount((count) => count + 1);
    }),
  );

  // stuff for handling content-editable - first, a ref to attach to the element
  const contentEditableRef = useRef<HTMLDivElement | null>(null);

  // end the edit: if it's been left blank and can't be, put back what was
  // there when it began, and save that (after anything already waiting, which
  // may be part-deleted text). Then save any change that's waiting, so it's in
  // before whatever took the focus (e.g. a Save button) acts
  const endEdit = useCallback(
    (save: Save) => {
      const start = editStartRef.current;
      editStartRef.current = null;
      if (required && isBlank(displayRef.current)) {
        const restored = start !== null && !isBlank(start) ? start : value;
        if (!isBlank(restored)) {
          setDisplay(restored);
          if (contentEditableRef.current) {
            contentEditableRef.current.textContent = restored;
          }
          saver.save(restored, save);
        }
      }
      saver.flush();
    },
    [required, value, saver, setDisplay],
  );
  const endEditRef = useRef(endEdit);
  useEffect(() => {
    endEditRef.current = endEdit;
  }, [endEdit]);

  // callback for blur
  const onBlur = useCallback(() => {
    focusedRef.current = false;
    endEdit(onChangeOrig);
  }, [endEdit, onChangeOrig]);

  // and don't lose a waiting change when the input goes away
  useEffect(() => () => endEditRef.current(saveRef.current), []);

  const onChange = useCallback(
    (value: string) => {
      if (editStartRef.current === null) {
        editStartRef.current = displayRef.current;
      }
      setDisplay(value);
      // blank isn't saved, if it can't be: the edit isn't over yet
      if (required && isBlank(value)) return;
      saver.save(value, onChangeOrig);
    },
    [saver, onChangeOrig, required, setDisplay],
  );

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

  // show the value when it changes, or once our saves are done, unless
  // something of ours is still on its way (see above)
  useEffect(() => {
    if (focusedRef.current || saver.isBusy()) return;
    // a change made without focus (e.g. in tests) has ended when it's settled
    editStartRef.current = null;
    setDisplay(value);
    if (
      contentEditableRef.current &&
      contentEditableRef.current.textContent !== value
    ) {
      contentEditableRef.current.textContent = value;
    }
  }, [value, settledCount, saver]);

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
