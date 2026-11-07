import type { PropsWithChildren } from "react";
import React from "react";

import { useTheme } from "../hooks/useTheme";
import { absoluteCover } from "./absoluteCover";
import { CSSReset } from "./CSSReset";
import { surface } from "../styled-system/recipes";
import { css, cx } from "../styled-system/css";

const Fallback = () => {
  const theme = useTheme();
  return (
    <CSSReset
      theme={theme}
      mode="large"
      className={cx(surface(), css(absoluteCover))}
    >
      <i
        className={cx(
          "fas fa-spinner fa-spin",
          css({
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "3em",
          }),
        )}
      />
    </CSSReset>
  );
};

export const Suspense = ({ children }: PropsWithChildren) => (
  <React.Suspense fallback={<Fallback />}>{children}</React.Suspense>
);
