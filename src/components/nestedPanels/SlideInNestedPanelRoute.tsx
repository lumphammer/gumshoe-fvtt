import {
  type PropsWithChildrenAndDirection,
  useNavigationContext,
} from "@lumphammer/minirouter";
import { SlideInRoute } from "@lumphammer/minirouter/animated";
import type { ReactNode } from "react";
import React from "react";

import { absoluteCover } from "../absoluteCover";
import { NestedPanel } from "./NestedPanel";

type SlideInNestedPanelRouteProps = PropsWithChildrenAndDirection<{
  className?: string;
  margin?: string | number;
  closeOnClickOutside?: boolean;
  /**
   * Routes nested under this one which should slide in over the whole area
   * rather than inside this panel.
   */
  childRoutes?: ReactNode;
}>;

const BlurPanel = () => {
  const { navigate } = useNavigationContext();
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate("here", "up");
      }}
      css={{
        ...absoluteCover,
        pointerEvents: "all",
      }}
    />
  );
};

export const SlideInNestedPanelRoute = React.memo<SlideInNestedPanelRouteProps>(
  ({
    children,
    direction,
    className,
    margin,
    closeOnClickOutside,
    childRoutes,
  }) => {
    return (
      <SlideInRoute
        direction={direction}
        backdropContent={closeOnClickOutside ? <BlurPanel /> : undefined}
      >
        <NestedPanel className={className} margin={margin}>
          {children}
        </NestedPanel>
        {childRoutes}
      </SlideInRoute>
    );
  },
);

SlideInNestedPanelRoute.displayName = "SlideInNestedPanelRoute";
