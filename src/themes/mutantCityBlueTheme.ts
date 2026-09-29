import type { ThemeSeedV1 } from "@lumphammer/investigator-fvtt-types";

import { averiaLibre } from "./constants";
import { createBasicTabStyle, themeFactory } from "./functions";
import { tealTheme } from "./tealTheme";
import type { ThemeV1 } from "./types";

const stripe1 = "#e2e3e9";
const stripe2 = "#ececed";

const shadowBase = "#000000";
const shadow1 = `${shadowBase}17`;
const shadow2 = `${shadowBase}00`;

const colors: ThemeSeedV1["colors"] = {
  accent: "#005d89",
  accentContrast: "white",
  glow: "#5effff",
  wallpaper: "#ddd",
  backgroundSecondary: "#9992",
  backgroundPrimary: "#fff7",
  backgroundButton: "rgba(0,0,0,0.1)",
  text: "#433",
  controlBorder: "#766",
};

const accentTrans = `${colors.accent}77`;

export const mutantCityBlueTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Mutant City Blue",
  global: `
    @import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');
    ${averiaLibre.importStatement}
  `,
  largeSheetRootStyle: {
    fontSize: "1.1em",
    backgroundImage: `
      radial-gradient(
        farthest-corner,
        #fffb 0%,
        #fffb 50%,
        #fff0 100%
      ),
      repeating-linear-gradient(45deg, ${stripe1} 0px, ${stripe1} 20px, ${stripe2} 20px, ${stripe2} 40px)
    `,
  },
  bodyFont: averiaLibre.fontFamily,
  displayFont: "normal normal normal 1em 'Russo One', serif",
  logo: {
    frontTextElementStyle: {
      background: `repeating-linear-gradient(180deg, ${accentTrans} 0,${accentTrans} 2px, ${colors.accent} 2px, ${colors.accent} 4px)`,
      // filter: "blur(0.5px)",
      backgroundClip: "text",
    },
    rearTextElementStyle: {
      // display: "none",
      textShadow: "2px 0px 1px white, 6px 0px 4px #fff7, -1px 0px 0px #fff7",
    },
    textElementsStyle: {
      // transform: "rotateY(-30deg) rotateZ(-1deg) translateX(-5%)",
      font: "normal normal normal 1em 'Russo One', serif",
    },
    backdropStyle: {
      perspective: "500px",
      perspectiveOrigin: "50% 50%",
      backgroundImage:
        "radial-gradient(closest-side, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
    },
  },
  tabStyle: {
    ...createBasicTabStyle(colors),
    fontSize: "1.2em",
    color: colors.accent,
    border: `1px solid ${colors.accent}`,
    backgroundColor: colors.backgroundSecondary,
    backgroundImage: `linear-gradient(to top, ${shadow1} 0%, ${shadow1} 10%, ${shadow2} 10%)`,
  },
  tabActiveStyle: {
    ...tealTheme.tabActiveStyle,
    borderBottomStyle: "none",
  },
  tabSpacerStyle: {
    ...tealTheme.tabSpacerStyle,
    borderBottom: `1px solid ${colors.accent}`,
  },
  panelStylePrimary: {
    ...tealTheme.panelStylePrimary,
    border: `1px solid ${colors.accent}`,
    // borderStyle: "none solid solid solid",
  },
  tabContentStyle: {
    ...tealTheme.panelStylePrimary,
    border: `1px solid ${colors.accent}`,
    borderStyle: "none solid solid solid",
  },
  colors,
  cards: {
    base: {
      backdropStyle: {
        // background: "radial-gradient(circle at 50% 10%, #fff 0%, #eee 100%)",
        border: "3px solid #999",
        padding: "0.5em",
        position: "relative",
        borderRadius: "1em 0 1em 0",
        transformStyle: "preserve-3d",
        marginBottom: "4em",

        "--stripe1": stripe1,
        "--stripe2": stripe2,
        "--shine": "#fffb",
        background: `
          radial-gradient(
            circle at 50% 10%,
            var(--shine) 0%,
            #fff0 100%
          ),
          repeating-linear-gradient(
            45deg,
            var(--stripe1) 0px,
            var(--stripe1) 20px,
            var(--stripe2) 20px,
            var(--stripe2) 40px
          ),
          linear-gradient(
            to bottom,
            #fff 0%,
            #fff 100%
          )
        `,
        // backgroundBlendMode: "1 1 1",

        // we use a container query to set --shadow-rotate based on the width of
        // the containing block. it would be sick if we could use a calc() here
        // to calculate the ration of the width to a fioxed value and use that
        // to scale the angle dynamically, but `\` in calc always produces a
        // value with units (length in this case) so we can't use that.
        "--shadow-rotate": "5deg",
        "@container (width > 200px)": {
          "--shadow-rotate": "4deg",
        },
        "@container (width > 400px)": {
          "--shadow-rotate": "3deg",
        },
        "@container (width > 600px)": {
          "--shadow-rotate": "2deg",
        },
        "@container (width > 800px)": {
          "--shadow-rotate": "1deg",
        },
        "@container (width > 1200px)": {
          "--shadow-rotate": "0.6deg",
        },
        "@container (width > 1600px)": {
          "--shadow-rotate": "0.3deg",
        },

        ":before, :after": {
          content: '""',
          display: "block",
          boxShadow: "0 2em 0.5em -1em #0004",
          position: "absolute",
          // top: 0,
          height: "6em",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "transparent",
          zIndex: -1,
        },

        ":after": {
          borderBottomRightRadius: "2em",
          transform:
            "rotate(var(--shadow-rotate)) translateY(-0.8em) translateX(1em) translateZ(-10px)",
        },

        ":before": {
          transform:
            "rotate(calc(var(--shadow-rotate) * -1)) translateY(-0.8em) translateX(-1em) translateZ(-10px)",
        },
      },
      hoverStyle: {
        // background: "radial-gradient(circle at 50% 20%, #fff 0%, #dee5f1 100%)",
        "--shine": "#ffff",
        border: "3px solid #666",
        ":before, :after": {
          boxShadow: "0 2em 0.5em -1em #0008",
        },
      },
    },
    categories: {
      grf: {
        backdropStyle: {
          "--stripe1": "#f002",
          "--stripe2": "#f001",
          borderColor: "#633",
        },
        hoverStyle: {
          // background: "none",
        },
      },
      stress: {
        backdropStyle: {
          "--stripe1": "#04b2",
          "--stripe2": "#04b1",
          borderColor: "#057",
        },
        hoverStyle: {
          borderColor: "#068",
        },
      },
    },
    area: {
      horizontalSpacing: "0.5em",
      verticalSpacing: "1em",
    },
  },
});
