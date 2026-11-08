import { defineThemeV2 } from "./theme";

export const mutantCityBlueTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Mutant City Blue",
  palette: {
    polarity: "light",
    wallpaper: "#ddd",
    surface: "#fff7",
    surfaceNested: "#9992",
    control: "rgba(0,0,0,0.1)",
    text: "#433",
    accent: "#005d89",
    line: "#766",
    feedback: "#5effff",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #433 70%, rgb(236, 236, 236))",
    onAccent: "white",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "normal normal normal 1em 'Russo One', serif",
    cardGap: "1em 0.5em",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            fontSize: "1.1em",
            backgroundImage:
              "\n      radial-gradient(\n        farthest-corner,\n        #fffb 0%,\n        #fffb 50%,\n        #fff0 100%\n      ),\n      repeating-linear-gradient(45deg, #e2e3e9 0px, #e2e3e9 20px, #ececed 20px, #ececed 40px)\n    ",
          },
          small: {
            fontSize: "1.1em",
            backgroundImage:
              "\n      radial-gradient(\n        farthest-corner,\n        #fffb 0%,\n        #fffb 50%,\n        #fff0 100%\n      ),\n      repeating-linear-gradient(45deg, #e2e3e9 0px, #e2e3e9 20px, #ececed 20px, #ececed 40px)\n    ",
          },
        },
      },
    },
    logo: {
      base: {
        backdrop: {
          perspective: "500px",
          perspectiveOrigin: "50% 50%",
          backgroundImage:
            "radial-gradient(closest-side, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
        },
        text: {
          position: "absolute",
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
          font: "normal normal normal 1em 'Russo One', serif",
          textTransform: "var(--inv-display-case)",
          fontSize: "4em",
          whiteSpace: "nowrap",
          caretColor: "black",
          border: "none",
          padding: "0",
          lineHeight: "1",
        },
        front_wrapper: {
          color: "transparent",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        },
        front: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          fontSize: "calc(1em * var(--logo-fit, 1))",
          padding: "0 1em",
          background:
            "repeating-linear-gradient(180deg, #005d8977 0,#005d8977 2px, #005d89 2px, #005d89 4px)",
          backgroundClip: "text",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          background:
            "repeating-linear-gradient(180deg, #005d8977 0,#005d8977 2px, #005d89 2px, #005d89 4px)",
          backgroundClip: "text",
        },
        measure: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          padding: "0 1em",
          background:
            "repeating-linear-gradient(180deg, #005d8977 0,#005d8977 2px, #005d89 2px, #005d89 4px)",
          backgroundClip: "text",
          position: "absolute",
          top: "0",
          left: "0",
          fontSize: "1em",
        },
        rear_wrapper: {
          zIndex: -1,
          color: "transparent",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        },
        rear: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          fontSize: "calc(1em * var(--logo-fit, 1))",
          padding: "0 1em",
          textShadow:
            "2px 0px 1px white, 6px 0px 4px #fff7, -1px 0px 0px #fff7",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          textShadow:
            "2px 0px 1px white, 6px 0px 4px #fff7, -1px 0px 0px #fff7",
        },
      },
    },
    surface: {
      compoundVariants: [
        {
          depth: "top",
          solid: true,
          css: {
            backgroundColor: "rgb(236, 236, 236)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(211, 211, 211)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(236, 236, 236)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(236, 236, 236)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(211, 211, 211)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(236, 176, 176)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(218, 202, 202)",
          },
        },
        {
          header: false,
          odd: true,
          zero: true,
          css: {
            background: "rgba(255, 127, 127, 0.47)",
          },
        },
        {
          header: false,
          odd: false,
          zero: true,
          css: {
            background: "rgba(204, 76, 76, 0.13)",
          },
        },
      ],
    },
    select: {
      base: {
        font: "var(--inv-body-font)",
        fontVariantLigatures: "none",
        color: "var(--inv-text)",
        padding: "0.1em 0.3em",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--inv-line)",
        boxShadow: "none",
        "&:is(:hover, [data-hover])": {
          borderColor: "var(--inv-line)",
        },
        "&:is(:focus, [data-focus])": {
          borderColor: "var(--inv-line)",
          boxShadow: "none",
        },
        "&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])": {
          opacity: 0.7,
        },
        background: "rgb(211, 211, 211)",
        "& option": {
          background: "rgb(236, 236, 236)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(236, 236, 236)",
        opacity: 0.7,
        "&:is(:hover, [data-hover])": {
          opacity: 1,
          transform: "scale(1.1)",
          color: "var(--inv-accent)",
        },
      },
    },
    callout: {
      variants: {
        tone: {
          neutral: {
            background:
              "color-mix(in srgb, var(--inv-line) 30%, rgb(236, 236, 236))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(236, 236, 236))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(236, 236, 236))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(236, 236, 236))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(236, 236, 236))",
          },
        },
      },
    },
    card: {
      base: {
        root: {
          '&:where(:not([data-category="grf"], [data-category="stress"]))': {
            border: "3px solid #999",
            padding: "0.5em",
            position: "relative",
            borderRadius: "1em 0 1em 0",
            transformStyle: "preserve-3d",
            marginBottom: "4em",
            "--stripe1": "#e2e3e9",
            "--stripe2": "#ececed",
            "--shine": "#fffb",
            background:
              "\n          radial-gradient(\n            circle at 50% 10%,\n            var(--shine) 0%,\n            #fff0 100%\n          ),\n          repeating-linear-gradient(\n            45deg,\n            var(--stripe1) 0px,\n            var(--stripe1) 20px,\n            var(--stripe2) 20px,\n            var(--stripe2) 40px\n          ),\n          linear-gradient(\n            to bottom,\n            #fff 0%,\n            #fff 100%\n          )\n        ",
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
            "&:before, &:after": {
              content: '""',
              display: "block",
              boxShadow: "0 2em 0.5em -1em #0004",
              position: "absolute",
              height: "6em",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "transparent",
              zIndex: -1,
            },
            "&:after": {
              borderBottomRightRadius: "2em",
              transform:
                "rotate(var(--shadow-rotate)) translateY(-0.8em) translateX(1em) translateZ(-10px)",
            },
            "&:before": {
              transform:
                "rotate(calc(var(--shadow-rotate) * -1)) translateY(-0.8em) translateX(-1em) translateZ(-10px)",
            },
            "&.investigator-card-array-card:hover": {
              "--shine": "#ffff",
              border: "3px solid #666",
              "&:before, &:after": {
                boxShadow: "0 2em 0.5em -1em #0008",
              },
            },
          },
          '&:where([data-category="grf"])': {
            border: "3px solid #999",
            padding: "0.5em",
            position: "relative",
            borderRadius: "1em 0 1em 0",
            transformStyle: "preserve-3d",
            marginBottom: "4em",
            "--stripe1": "#f002",
            "--stripe2": "#f001",
            "--shine": "#fffb",
            background:
              "\n          radial-gradient(\n            circle at 50% 10%,\n            var(--shine) 0%,\n            #fff0 100%\n          ),\n          repeating-linear-gradient(\n            45deg,\n            var(--stripe1) 0px,\n            var(--stripe1) 20px,\n            var(--stripe2) 20px,\n            var(--stripe2) 40px\n          ),\n          linear-gradient(\n            to bottom,\n            #fff 0%,\n            #fff 100%\n          )\n        ",
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
            "&:before, &:after": {
              content: '""',
              display: "block",
              boxShadow: "0 2em 0.5em -1em #0004",
              position: "absolute",
              height: "6em",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "transparent",
              zIndex: -1,
            },
            "&:after": {
              borderBottomRightRadius: "2em",
              transform:
                "rotate(var(--shadow-rotate)) translateY(-0.8em) translateX(1em) translateZ(-10px)",
            },
            "&:before": {
              transform:
                "rotate(calc(var(--shadow-rotate) * -1)) translateY(-0.8em) translateX(-1em) translateZ(-10px)",
            },
            borderColor: "#633",
            "&.investigator-card-array-card:hover": {
              "--shine": "#ffff",
              border: "3px solid #666",
              "&:before, &:after": {
                boxShadow: "0 2em 0.5em -1em #0008",
              },
            },
          },
          '&:where([data-category="stress"])': {
            border: "3px solid #999",
            padding: "0.5em",
            position: "relative",
            borderRadius: "1em 0 1em 0",
            transformStyle: "preserve-3d",
            marginBottom: "4em",
            "--stripe1": "#04b2",
            "--stripe2": "#04b1",
            "--shine": "#fffb",
            background:
              "\n          radial-gradient(\n            circle at 50% 10%,\n            var(--shine) 0%,\n            #fff0 100%\n          ),\n          repeating-linear-gradient(\n            45deg,\n            var(--stripe1) 0px,\n            var(--stripe1) 20px,\n            var(--stripe2) 20px,\n            var(--stripe2) 40px\n          ),\n          linear-gradient(\n            to bottom,\n            #fff 0%,\n            #fff 100%\n          )\n        ",
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
            "&:before, &:after": {
              content: '""',
              display: "block",
              boxShadow: "0 2em 0.5em -1em #0004",
              position: "absolute",
              height: "6em",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "transparent",
              zIndex: -1,
            },
            "&:after": {
              borderBottomRightRadius: "2em",
              transform:
                "rotate(var(--shadow-rotate)) translateY(-0.8em) translateX(1em) translateZ(-10px)",
            },
            "&:before": {
              transform:
                "rotate(calc(var(--shadow-rotate) * -1)) translateY(-0.8em) translateX(-1em) translateZ(-10px)",
            },
            borderColor: "#057",
            "&.investigator-card-array-card:hover": {
              "--shine": "#ffff",
              border: "3px solid #666",
              "&:before, &:after": {
                boxShadow: "0 2em 0.5em -1em #0008",
              },
              borderColor: "#068",
            },
          },
        },
        supertitle: {
          ':where(.inv-card__root:is(:not([data-category="grf"], [data-category="stress"]))) &':
            {
              fontSize: "0.9em",
            },
          ':where(.inv-card__root:is([data-category="grf"])) &': {
            fontSize: "0.9em",
          },
          ':where(.inv-card__root:is([data-category="stress"])) &': {
            fontSize: "0.9em",
          },
        },
        title: {
          ':where(.inv-card__root:is(:not([data-category="grf"], [data-category="stress"]))) &':
            {},
          ':where(.inv-card__root:is([data-category="grf"])) &': {},
          ':where(.inv-card__root:is([data-category="stress"])) &': {},
        },
        subtitle: {
          ':where(.inv-card__root:is(:not([data-category="grf"], [data-category="stress"]))) &':
            {
              fontWeight: "bold",
            },
          ':where(.inv-card__root:is([data-category="grf"])) &': {
            fontWeight: "bold",
          },
          ':where(.inv-card__root:is([data-category="stress"])) &': {
            fontWeight: "bold",
          },
        },
        description: {
          ':where(.inv-card__root:is(:not([data-category="grf"], [data-category="stress"]))) &':
            {},
          ':where(.inv-card__root:is([data-category="grf"])) &': {},
          ':where(.inv-card__root:is([data-category="stress"])) &': {},
        },
        effect: {
          ':where(.inv-card__root:is(:not([data-category="grf"], [data-category="stress"]))) &':
            {
              fontStyle: "italic",
            },
          ':where(.inv-card__root:is([data-category="grf"])) &': {
            fontStyle: "italic",
          },
          ':where(.inv-card__root:is([data-category="stress"])) &': {
            fontStyle: "italic",
          },
        },
      },
    },
    panel: {
      base: {
        padding: "0.5em",
      },
      variants: {
        depth: {
          top: {
            backgroundColor: "rgba(255,255,255,0.5)",
            border: "1px solid #005d89",
          },
          nested: {
            backgroundColor: "rgba(255,255,255,0.5)",
            border: "1px solid #005d89",
          },
        },
      },
    },
    tabs: {
      base: {
        tab: {
          font: "var(--inv-display-font)",
          textTransform: "var(--inv-display-case)",
          letterSpacing: "var(--inv-display-letter-spacing)",
          textAlign: "center",
          flex: 1,
          padding: "0.3em",
          display: "inline-block",
          fontSize: "1.2em",
          background: "#9992",
          borderRadius: "0.2em 0.2em 0 0",
          color: "#005d89",
          "&:hover": {
            textShadow: "0 0 0.3em #5effff",
          },
          border: "1px solid #005d89",
          backgroundColor: "#9992",
          backgroundImage:
            "linear-gradient(to top, #00000017 0%, #00000017 10%, #00000000 10%)",
          ":not([data-wrapped]) > input:checked + &": {
            background: "rgba(255,255,255,0.5)",
            "&:hover": {
              textShadow: "none",
            },
            borderBottomStyle: "none",
          },
          "[data-wrapped] > &": {
            borderRadius: "0.2em",
          },
          "[data-wrapped] > input:checked + &": {
            background: "rgba(255,255,255,0.5)",
            "&:hover": {
              textShadow: "none",
            },
          },
          "input:disabled + &:hover": {
            textShadow: "none",
          },
        },
        spacer: {
          width: "0.5em",
          borderBottom: "1px solid #005d89",
        },
        content: {
          padding: "0.5em",
          backgroundColor: "rgba(255,255,255,0.5)",
          border: "1px solid #005d89",
          borderStyle: "none solid solid solid",
          "[data-wrapped] + &": {
            borderStyle: "solid",
            borderRadius: "0.2em",
          },
        },
      },
    },
  },
});
