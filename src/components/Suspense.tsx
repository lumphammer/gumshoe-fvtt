import type { PropsWithChildren } from "react";
import React from "react";

import { useTheme } from "../hooks/useTheme";
import { absoluteCover } from "./absoluteCover";
import { CSSReset } from "./CSSReset";

const Fallback = () => {
  const theme = useTheme();
  return (
    <CSSReset
      theme={theme}
      mode="large"
      css={{
        ...absoluteCover,
        backgroundColor: theme.colors.backgroundPrimary,
      }}
    >
      <i
        className="fas fa-spinner fa-spin"
        css={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "3em",
          color: theme.colors.text,
        }}
      />
    </CSSReset>
  );
};

export const Suspense = ({ children }: PropsWithChildren) => (
  <React.Suspense fallback={<Fallback />}>{children}</React.Suspense>
);
