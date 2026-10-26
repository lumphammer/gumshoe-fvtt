import type { CSSObject } from "@emotion/react";
import { type RefObject, useContext, useEffect, useRef } from "react";

import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useIsEditable } from "../../hooks/useIsEditable";
import { ThemeContext } from "../../themes/ThemeContext";

type LogoEditableProps = {
  className?: string;
  mainText: string;
  subText?: string;
  defaultSubText?: string;
  onChangeMainText: (newValue: string) => void;
  onChangeSubText?: (newValue: string) => void;
};

const subtextSyle: CSSObject = {
  fontSize: "0.5em",
  padding: "0 1em",
  minHeight: "1em",
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
 * before the first paint, and the transition is turned on in the frame after.
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
    let frame: number | undefined;
    const observer = new ResizeObserver(() => {
      const available = wrapper.clientWidth;
      const natural = measure.offsetWidth;
      if (!available || !natural) {
        // not laid out (e.g. in a hidden tab)
        return;
      }
      const scale = Math.min(1, available / natural);
      wrapper.style.setProperty("--logo-fit", String(scale));
      frame ??= requestAnimationFrame(() => {
        wrapper.style.setProperty("--logo-fit-duration", "500ms");
      });
    });
    observer.observe(wrapper);
    observer.observe(measure);
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [wrapperRef, measureRef]);
};

const textStyle: CSSObject = {
  transition: "font-size var(--logo-fit-duration, 0s)",
  fontSize: "calc(1em * var(--logo-fit, 1))",
  padding: "0 1em",
};

// clips the measuring copy, so it can't make anything scroll
const measureClipStyle: CSSObject = {
  position: "absolute",
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  overflow: "hidden",
  visibility: "hidden",
};

const measureStyle: CSSObject = {
  position: "absolute",
  top: 0,
  left: 0,
  fontSize: "1em",
};

const textBearerStyle: CSSObject = {
  color: "transparent",
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
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
  const theme = useContext(ThemeContext);

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
      className={`logo ${className}`}
      css={{
        display: "block",
        position: "relative",
        height: "6em",
        width: "auto",
        perspective: "500px",
        perspectiveOrigin: "50% 50%",
      }}
    >
      {/* Backdrop */}
      <div
        className="backdrop"
        css={{
          ...theme.logo.backdropStyle,
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      />
      {/* inner - apply the transform */}
      <div
        className="text-elements-wrapper"
        ref={wrapperRef}
        css={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          font: theme.displayFont,
          textTransform: theme.displayFontTextTransform,
          fontSize: "4em",
          whiteSpace: "nowrap",
          caretColor: "black",
          border: "none",
          padding: 0,
          lineHeight: 1,
          ...theme.logo.textElementsStyle,
        }}
      >
        {/* rear-element, aka the shadow-bearer */}
        <div
          className="rear-text-element shadow-bearer"
          aria-hidden
          css={{
            zIndex: -1,
            ...textBearerStyle,
            ...theme.logo.rearTextElementWrapperStyle,
          }}
        >
          <div
            css={{
              ...textStyle,
              ...theme.logo.rearTextElementStyle,
            }}
          >
            {displayText}
          </div>
          {hasSubtext && (
            <div
              css={{
                ...subtextSyle,
                ...theme.logo.rearTextElementStyle,
              }}
            >
              {displaySubtext}
            </div>
          )}
        </div>

        {/* front element, aka the gradient-bearer (on themes that have text
          gradients) */}
        <div
          css={{
            ...textBearerStyle,
            ...theme.logo.frontTextElementWrapperStyle,
          }}
          className="front-text-element gradient-bearer"
        >
          {/* full-size copy of the main text, to measure it */}
          <div aria-hidden css={measureClipStyle}>
            <div
              ref={measureRef}
              css={{
                ...textStyle,
                ...theme.logo.frontTextElementStyle,
                ...measureStyle,
              }}
            >
              {displayText}
            </div>
          </div>
          <div
            css={{
              ...textStyle,
              ...theme.logo.frontTextElementStyle,
            }}
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
              css={{
                ...subtextSyle,
                ...theme.logo.frontTextElementStyle,
              }}
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
