import type { PropsWithChildren } from "react";
import React from "react";

import { runtimeConfig } from "../runtime";
import { settings } from "../settings/settings";
import { absoluteCover } from "./absoluteCover";
import { CSSReset } from "./CSSReset";

const Fallback = () => {
  const theme =
    runtimeConfig.themes[settings.defaultThemeName.get()] ||
    runtimeConfig.themes["tealTheme"];
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
