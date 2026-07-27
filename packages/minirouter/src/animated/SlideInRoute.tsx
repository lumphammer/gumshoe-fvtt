import { CSSObject } from "@emotion/react";
import { AnimatePresence, m } from "motion/react";
import { memo, ReactNode } from "react";

import { PropsWithChildrenAndDirection } from "../types";
import { useNavigationContext } from "../useNavigationContext";
import { useRoute } from "../useRoute";
import { duration } from "./constants";
import { CustomLazyMotion } from "./CustomLazyMotion";
import { easeInCubic, easeOutCubic } from "./easings";

const absoluteCover: CSSObject = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

type SlideInRouteProps = PropsWithChildrenAndDirection<{
  backdropContent?: ReactNode;
}>;

export const SlideInRoute = memo<SlideInRouteProps>(
  ({ children, direction, backdropContent }) => {
    const result = useRoute({ direction, children });
    const backdropResult = useRoute({ direction, children: backdropContent });
    const { currentStep } = useNavigationContext();
    return (
      <CustomLazyMotion>
        <div
          css={{ ...absoluteCover, overflow: "hidden", pointerEvents: "none" }}
        >
          <AnimatePresence mode="wait">
            {backdropResult && currentStep && (
              <>
                {backdropResult}
                <m.div
                  key={currentStep.id}
                  css={{
                    ...absoluteCover,
                    width: "100%",
                    zIndex: 2,
                  }}
                  initial={{
                    x: "100%",
                  }}
                  animate={{
                    x: 0,
                    transition: { duration, ease: easeOutCubic },
                  }}
                  exit={{
                    x: "100%",
                    zIndex: 1,
                    transition: { duration, ease: easeInCubic },
                  }}
                >
                  {result}
                </m.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </CustomLazyMotion>
    );
  },
);

SlideInRoute.displayName = "SlideInRoute";
