import { CSSReset } from "../../components/CSSReset";
import type { Theme } from "../theme";
import { css } from "../../styled-system/css";

type ThemeSwatchProps = {
  theme: Theme;
};

export const ThemeSwatch = ({ theme }: ThemeSwatchProps) => {
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "1em",
      })}
    >
      <CSSReset
        noStyleAppWindow
        mode="small"
        theme={theme}
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1em",
        })}
      >
        <div
          className={css({
            flex: "[1]",
            backgroundColor: "transparent",
          })}
        >
          {theme.displayName}
          <br />
          transparent
        </div>
        <div
          className={css({
            flex: "[1]",
          })}
          style={{ backgroundColor: theme.palette.surface }}
        >
          {theme.displayName}
          <br />
          surface
        </div>
        <div
          className={css({
            flex: "[1]",
          })}
          style={{ backgroundColor: theme.palette.surfaceNested }}
        >
          {theme.displayName}
          <br />
          surfaceNested
        </div>
      </CSSReset>
    </div>
  );
};
