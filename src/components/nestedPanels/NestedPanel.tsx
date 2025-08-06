import { useNavigationContext } from "@lumphammer/minirouter";
import React, {
  memo,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

import { ThemeContext } from "../../themes/ThemeContext";
import { ArrowLink } from "./ArrowLink";
import { focusableSelector } from "./focusableSelector";

const defaultPanelMargin = "3em";

type NestedPanelProps = PropsWithChildren<{
  className?: string;
  margin?: string | number;
}>;

export const NestedPanel = memo<NestedPanelProps>(
  ({ children, className, margin = defaultPanelMargin }) => {
    const theme = useContext(ThemeContext);
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

    // focus the first element in the panel when it's a leaf route
    useEffect(() => {
      // if there's anything below us (currentStep is a little confusing, it's
      // the step that will be routed if we mount a `<Route>`), we bail out.
      if (currentStep) {
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
    }, [currentStep]);

    return (
      <>
        <section
          ref={ref}
          className={className}
          onKeyDown={handleKeyDown}
          css={{
            position: "absolute",
            top: 0,
            left: margin,
            right: 0,
            bottom: 0,
            padding: "1em",
            backgroundColor: theme.colors.bgOpaquePrimary,
            boxShadow: `0 0 min(${margin}, ${defaultPanelMargin}) 0 #0007`,
            overflow: "auto",
            borderLeft: `1px solid ${theme.colors.controlBorder}`,
            display: "flex",
            flexDirection: "column",
            pointerEvents: "all",
          }}
        >
          <div className="nav-bar">
            <ArrowLink back to="up">
              Back
            </ArrowLink>
          </div>
          {/* actual children */}
          <div
            ref={childrenAreaRef}
            className="children-box"
            css={{ flex: 1, paddingTop: "1em" }}
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
