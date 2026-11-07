import { CSSReset } from "../../components/CSSReset";
import type { ThemeV1 } from "../types";
import { css } from "../../styled-system/css";

type ThemeSwatchProps = {
  theme: ThemeV1;
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
          style={{ backgroundColor: theme.colors.backgroundPrimary }}
        >
          {theme.displayName}
          <br />
          bgTransPrimary
        </div>
        <div
          className={css({
            flex: "[1]",
          })}
          style={{ backgroundColor: theme.colors.backgroundSecondary }}
        >
          {theme.displayName}
          <br />
          bgTransSecondary
        </div>
      </CSSReset>
    </div>
  );
};
