import { useNavigationContext } from "@lumphammer/minirouter";
import type { PropsWithChildren } from "react";
import React, { memo, useCallback, useContext, useEffect, useRef } from "react";

import { ArrowLink } from "./ArrowLink";
import { focusableSelector } from "./focusableSelector";
import { ShowBackLinkContext } from "./ShowBackLinkContext";
import { useReturnFocus } from "./UnderPanels";
import { floating } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";
import type { CSSProperties } from "react";

const defaultPanelMargin = "3em";

type NestedPanelProps = PropsWithChildren<{
  className?: string;
  margin?: string | number;
}>;

export const NestedPanel = memo<NestedPanelProps>(
  ({ children, className, margin = defaultPanelMargin }) => {
    const showBackLink = useContext(ShowBackLinkContext);
    const { navigate, currentStep } = useNavigationContext();
    const childrenAreaRef = useRef<HTMLDivElement>(null);
    const ref = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          navigate("here", "up");
        }
      },
      [navigate],
    );

    // back from a panel over this one: focus goes back to what opened it
    // (this runs first, being declared first)
    const { onFocus, returned } = useReturnFocus(currentStep !== undefined);

    // focus the first element in the panel when it's a leaf route
    useEffect(() => {
      // if there's anything below us (currentStep is a little confusing, it's
      // the step that will be routed if we mount a `<Route>`), or focus has
      // gone back to what opened the panel that was, we bail out.
      if (currentStep || returned.current) {
        return;
      }
      const firstElement =
        childrenAreaRef.current?.querySelectorAll<HTMLElement>(
          focusableSelector,
        )[0];
      // preventScroll is needed to avoid some crazy interactions with panel
      // animations - without it, the browser will try to scroll the parent left
      // to bring the focused element into view while it's already animating
      // into position
      firstElement?.focus({ preventScroll: true });
    }, [currentStep, returned]);

    return (
      <>
        <section
          ref={ref}
          className={cx(
            cx(floating({ kind: "drawer" }), className),
            css({
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              padding: "1em",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              pointerEvents: "all",
            }),
          )}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          // a panel open over this one: only that one can be reached
          inert={currentStep !== undefined}
          style={
            {
              "--drawer-shadow-size": `min(${margin}, ${defaultPanelMargin})`,
              left: margin,
            } as CSSProperties
          }
        >
          {showBackLink && (
            <div className="nav-bar">
              <ArrowLink back to="up">
                Back
              </ArrowLink>
            </div>
          )}
          {/* actual children */}
          <div
            ref={childrenAreaRef}
            className={cx(
              "children-box",
              css({
                flex: "[1]",
                paddingTop: showBackLink ? "1em" : undefined,
              }),
            )}
          >
            {children}
          </div>
          {/* <DevTools /> */}
        </section>
      </>
    );
  },
);

NestedPanel.displayName = "NestedPanel";
