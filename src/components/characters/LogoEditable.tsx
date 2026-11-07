import { type RefObject, useEffect, useRef } from "react";

import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useIsEditable } from "../../hooks/useIsEditable";
import { css, cx } from "../../styled-system/css";
import { logo } from "../../styled-system/recipes";

type LogoEditableProps = {
  className?: string;
  mainText: string;
  subText?: string;
  defaultSubText?: string;
  onChangeMainText: (newValue: string) => void;
  onChangeSubText?: (newValue: string) => void;
};

/**
 * Fit the main text to the width of the logo by setting `--logo-fit` on
 * `wrapper`: a scale factor, at most 1, for the main text's font size.
 *
 * `measure` is a hidden copy of the text at full size. Measuring that, not the
 * text itself, gives the same answer however big the text currently is (glyph
 * widths are rounded, so text doesn't scale quite linearly), and doesn't
 * change when the text is resized. Widths are layout widths, so they ignore
 * any transforms a theme applies.
 *
 * Changes in size are animated, but not the first fit: the text should just
 * appear at the right size. The first measurement comes after layout but
 * before the first paint, so it's not animated as long as the transition is
 * off. It's turned on once the fonts have loaded (the first sheet opened may
 * be measured in a fallback font, then refitted when the theme's arrives) and
 * the refit that causes has happened, a frame later.
 */
const useFitTextToWidth = (
  wrapperRef: RefObject<HTMLElement | null>,
  measureRef: RefObject<HTMLElement | null>,
) => {
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const measure = measureRef.current;
    if (!wrapper || !measure) {
      return;
    }
    let started = false;
    let stopped = false;
    let frame: number | undefined;
    const startAnimating = async () => {
      await wrapper.ownerDocument.fonts.ready;
      if (stopped) {
        return;
      }
      // one frame for the refit, if a font arrived, and one after it
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          wrapper.style.setProperty("--logo-fit-duration", "500ms");
        });
      });
    };
    const observer = new ResizeObserver(() => {
      const available = wrapper.clientWidth;
      const natural = measure.offsetWidth;
      if (!available || !natural) {
        // not laid out (e.g. in a hidden tab)
        return;
      }
      const scale = Math.min(1, available / natural);
      wrapper.style.setProperty("--logo-fit", String(scale));
      if (!started) {
        started = true;
        void startAnimating();
      }
    });
    observer.observe(wrapper);
    observer.observe(measure);
    return () => {
      stopped = true;
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [wrapperRef, measureRef]);
};

/**
 * Fancy editable logo text for the top of the character sheet.
 *
 * This component is a bit tricksy and is made up of several elements.
 *
 * There are two strings displayed: `mainText` and "subText". Both strings are
 * rendered twice, to allow for various CSS shenanigans, so there is a
 * "front text element" and a "rear text element".
 *
 * There is also a backdrop which is just a div which can be styled however you
 * need in the theme.
 *
 * The main text is scaled down to fit the width of the logo, using a third,
 * hidden copy of it to measure.
 *
 * There is a known bug in Firefox at the time of writing which screws up the
 * rendering https://bugzilla.mozilla.org/show_bug.cgi?id=1720995
 * It's is marked RESOLVED, I've tested in nightly (as of 2021-07-28) and it
 * seems okay, so I'm not going to sweat it.
 */
export const LogoEditable = ({
  className,
  mainText,
  subText,
  defaultSubText = "",
  onChangeMainText,
  onChangeSubText,
}: LogoEditableProps) => {
  const classes = logo();

  // all the editing logic is done in the hook
  const {
    onInput: onInputText,
    onKeyDown: onKeyDownText,
    onPaste: onPasteText,
    onFocus: onFocusText,
    onBlur: onBlurText,
    contentEditableRef: contentEditableRefText,
    display: displayText,
  } = useAsyncUpdate(mainText, onChangeMainText);
  const isEditable = useIsEditable();

  // shown if there's anything to show; editable if there's a way to save it
  const hasSubtext = subText !== undefined || onChangeSubText !== undefined;

  const {
    onInput: onInputSubtext,
    onKeyDown: onKeyDownSubtext,
    onPaste: onPasteSubtext,
    onFocus: onFocusSubtext,
    onBlur: onBlurSubtext,
    contentEditableRef: contentEditableRefSubtext,
    display: displaySubtext,
  } = useAsyncUpdate(
    subText || defaultSubText,
    onChangeSubText ||
      (() => {
        // do nothing if no onChangeSubText
      }),
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  useFitTextToWidth(wrapperRef, measureRef);

  return (
    // outer - set the transform origin
    <div
      // layout, which call sites can change (componentDefaults.css)
      className={cx("logo", "inv-default-logo", className)}
    >
      {/* Backdrop: filling the logo, whatever the theme says */}
      <div
        className={cx(
          "backdrop",
          classes.backdrop,
          css({ position: "absolute", inset: "0" }),
        )}
      />
      {/* inner - apply the transform */}
      <div
        className={cx("text-elements-wrapper", classes.text)}
        ref={wrapperRef}
      >
        {/* rear-element, aka the shadow-bearer */}
        <div
          className={cx(
            "rear-text-element shadow-bearer",
            classes.rear_wrapper,
          )}
          aria-hidden
        >
          <div className={classes.rear}>{displayText}</div>
          {hasSubtext && (
            <div className={classes.rear_sub}>{displaySubtext}</div>
          )}
        </div>

        {/* front element, aka the gradient-bearer (on themes that have text
          gradients) */}
        <div
          className={cx(
            "front-text-element gradient-bearer",
            classes.front_wrapper,
          )}
        >
          {/* full-size copy of the main text, to measure it, clipped so it
            can't make anything scroll */}
          <div
            aria-hidden
            className={css({
              position: "absolute",
              top: "0",
              left: "0",
              width: "0",
              height: "0",
              overflow: "hidden",
              visibility: "hidden",
            })}
          >
            <div ref={measureRef} className={classes.measure}>
              {displayText}
            </div>
          </div>
          <div
            className={classes.front}
            contentEditable={isEditable}
            spellCheck={false}
            ref={contentEditableRefText}
            onInput={onInputText}
            onKeyDown={onKeyDownText}
            onPaste={onPasteText}
            onFocus={onFocusText}
            onBlur={onBlurText}
          />
          {hasSubtext && (
            <div
              className={classes.front_sub}
              contentEditable={isEditable && onChangeSubText !== undefined}
              spellCheck={false}
              ref={contentEditableRefSubtext}
              onInput={onInputSubtext}
              onKeyDown={onKeyDownSubtext}
              onPaste={onPasteSubtext}
              onFocus={onFocusSubtext}
              onBlur={onBlurSubtext}
            />
          )}
        </div>
      </div>
    </div>
  );
};
