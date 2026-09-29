import { CSSReset } from "../../components/CSSReset";
import type { ThemeV1 } from "../types";

type ThemeSwatchProps = {
  theme: ThemeV1;
};

export const ThemeSwatch = ({ theme }: ThemeSwatchProps) => {
  return (
    <div
      css={{
        display: "flex",
        flexDirection: "column",
        gap: "1em",
      }}
    >
      <CSSReset
        noStyleAppWindow
        mode="small"
        theme={theme}
        css={{
          display: "flex",
          flexDirection: "column",
          gap: "1em",
        }}
      >
        <div
          css={{
            flex: 1,
            backgroundColor: "transparent",
          }}
        >
          {theme.displayName}
          <br />
          transparent
        </div>
        <div
          css={{
            flex: 1,
            backgroundColor: theme.colors.backgroundPrimary,
          }}
        >
          {theme.displayName}
          <br />
          bgTransPrimary
        </div>
        <div
          css={{
            flex: 1,
            backgroundColor: theme.colors.backgroundSecondary,
          }}
        >
          {theme.displayName}
          <br />
          bgTransSecondary
        </div>
      </CSSReset>
    </div>
  );
};
