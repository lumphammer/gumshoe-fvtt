// Prints a built-in theme as the ThemeV2 it installs as (a V1 theme after
// `themeFromV1`), as JSON: what a makeover starts from.
//
//   pnpm theme:print niceThemeDark
//   pnpm theme:print            lists the theme names
import { baseThemes } from "../src/themes/baseThemes";

const name = process.argv[2];
if (!name) {
  console.log(Object.keys(baseThemes).join("\n"));
} else if (!Object.hasOwn(baseThemes, name)) {
  console.error(
    `No built-in theme "${name}". One of: ${Object.keys(baseThemes).join(", ")}`,
  );
  process.exit(1);
} else {
  console.log(JSON.stringify(baseThemes[name], null, 2));
}
