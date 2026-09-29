import type { CSSObject } from "@emotion/react";
import { useContext } from "react";

import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
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

  const textStyle: CSSObject = {
    transition: "font-size 500ms",
    fontSize: `${Math.min(1, theme.logo.fontScaleFactor / mainText.length)}em`,
    padding: "0 1em",
  };

  // all the editing logic is done in the hook
  const {
    onInput: onInputText,
    onFocus: onFocusText,
    onBlur: onBlurText,
    contentEditableRef: contentEditableRefText,
    display: displayText,
  } = useAsyncUpdate(mainText, onChangeMainText);

  const hasSubtext = onChangeSubText !== undefined;

  const {
    onInput: onInputSubtext,
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
        css={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          font: theme.displayFont,
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
          <div
            css={{
              ...textStyle,
              ...theme.logo.frontTextElementStyle,
            }}
            contentEditable
            ref={contentEditableRefText}
            onInput={onInputText}
            onFocus={onFocusText}
            onBlur={onBlurText}
          />
          {hasSubtext && (
            <div
              css={{
                ...subtextSyle,
                ...theme.logo.frontTextElementStyle,
              }}
              contentEditable
              ref={contentEditableRefSubtext}
              onInput={onInputSubtext}
              onFocus={onFocusSubtext}
              onBlur={onBlurSubtext}
            />
          )}
        </div>
      </div>
    </div>
  );
};
