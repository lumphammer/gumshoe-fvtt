/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/// <reference types="vitest" />
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "url";
import type { HttpProxy, Plugin, UserConfig } from "vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

import { vitePluginCompileFvttPacks as compilePacks } from "../../src/vitePluginCompileFvttPacks";

function kebabCaseToCamelCase(str: string) {
  return str.replace(/-([a-z0-9])/g, (g) => g[1].toUpperCase());
}

type CreateFvttViteConfigArgs = {
  foundryPackageId: string;
  importMetaUrl: string;
  packageType: "module" | "system";
  port?: number;
  sourceMap?: boolean;
  includeReact?: boolean;
  plugins?: Plugin[];
};

// this is lifted from
// https://github.com/vitejs/vite-plugin-react-swc/blob/21eef9eefd7ff3d46dc0a3132dac83d9bb49f980/src/index.ts
// if it breaks with a future @vitejs/vite-plugin-react-swc update, we'll need
// to update it or change behaviour to match the upstream.
const preambleCode = `
    import { injectIntoGlobalHook } from "__PATH__";
    injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;`;

/**
 * Create a vite config for a Foundry VTT package.
 *
 * original guide to using Vite for Foundry from the Lancer devs:
 * https://foundryvtt.wiki/en/development/guides/vite
 *
 * Supports React with HMR, SVGR, and dev server proxying to local Foundry.
 *
 * You will need to import this by relative path, e.g.
 * `./packages/shared-fvtt-bits/dotfiles/createFvttViteConfig` because vite
 * does not support importing typescript from packages.
 */
export function createFvttViteConfig({
  foundryPackageId,
  importMetaUrl,
  packageType,
  port = 40000,
  sourceMap = false,
  includeReact = true,
  plugins = [],
}: CreateFvttViteConfigArgs) {
  //
  // setup
  //

  const customizedPreambleCode = preambleCode.replace(
    "__PATH__",
    `/${packageType}s/${foundryPackageId}/@react-refresh`,
  );
  const preambleHtml =
    '\n<script type="module">\n' + customizedPreambleCode + "\n</script>\n";
  const headTag = "<head>";
  let foundryUrl = "http://localhost:30000";
  const rootDir = path.dirname(fileURLToPath(importMetaUrl));
  const foundryConfigPath = path.resolve(rootDir, "foundryconfig.json");

  // if foundryconfig.json exists, use that as the foundryUrl
  if (fs.existsSync(foundryConfigPath)) {
    foundryUrl = JSON.parse(fs.readFileSync(foundryConfigPath).toString()).url;
  } else {
    console.log("No foundryconfig.json found, we're probably in CI");
  }

  const config = defineConfig(({ mode }) => {
    const userConfig: UserConfig = {
      root: "src/",
      base: `/${packageType}s/${foundryPackageId}/`,
      publicDir: path.resolve(rootDir, "public"),

      // configure vitest
      test: {
        // fix "document is not defined"
        environment: "happy-dom",
        // equivalent to jest.setup.js
        setupFiles: ["../vitest.setup.js"],
        // https://vitest.dev/config/#silent
        // without this we get a bunch of noise from react whenever we test for
        // a react error
        silent: true,
      },

      server: {
        port,
        open: `http://localhost:${port}`,
        proxy: {
          // In dev mode, plugin-react needs a preamble inserted in the head. When
          // you run a "normal" vite app, each plugin gets a chance to transform the
          // `index.html`, so the react plugin can add the preamble. But when you
          // run a Foundry app, the `index.html` comes direct from Foundry itself
          // and the React plugin doesn't get a chance to transform it. So we need
          // to add the preamble ourselves. We do this by singling out the proxy
          // rule for `/game` and using `configure` to add some hooks to manually
          // insert the preamble ourselves.
          "/game": {
            // see https://github.com/http-party/node-http-proxy#modify-response
            selfHandleResponse: true,
            target: foundryUrl,
            configure: (proxy: HttpProxy.Server) => {
              proxy.on("proxyRes", function (proxyRes, req, res) {
                const body: Uint8Array[] = [];
                proxyRes.on("data", function (chunk) {
                  body.push(chunk);
                });
                proxyRes.on("end", function () {
                  const html = Buffer.concat(body).toString();
                  // this is the most future-proof way to get the preamble code.
                  const fixedHtml = html.replace(
                    headTag,
                    `${headTag}${preambleHtml}`,
                  );
                  res.statusCode = proxyRes.statusCode ?? 200;
                  // copy the headers from the proxy response to the real response
                  for (const [name, value] of Object.entries(
                    proxyRes.headers,
                  )) {
                    if (value === undefined) continue;
                    // because we're monkeying with the content length, we need to
                    // update it to match the new length
                    const newValue =
                      name.toLowerCase() === "content-length"
                        ? fixedHtml.length
                        : value;
                    res.setHeader(name, newValue);
                  }
                  res.end(fixedHtml);
                });
              });
            },
          },
          // ///////////////////////////////////////////
          // proxy everything else to the foundry server
          [`^(?!/${packageType}s/${foundryPackageId})`]: {
            target: foundryUrl,
          },
          "/socket.io": {
            target: foundryUrl.replace(/^https?/, "ws"),
            ws: true,
          },
        },
      },

      // vite's correct way to get env vars is through import.meta.env. however lots
      // of code relies on process.env, so we'll just fake that in here.
      // https://vitejs.dev/guide/env-and-mode.html
      // https://github.com/vitejs/vite/issues/1973#issuecomment-787571499
      define: {
        "process.env.NODE_ENV": JSON.stringify(process.env["NODE_ENV"]),
      },

      // see https://github.com/vitejs/vite/issues/8644#issuecomment-1159308803
      // see also https://github.com/vitejs/vite/pull/8674 (this PR should have
      // fixed it, but maybe it's not in the version we're using?)
      // discussion: https://github.com/vitejs/vite/discussions/8640?sort=old
      esbuild: {
        logOverride: { "this-is-undefined-in-esm": "silent" },
        // without this, the class name gets mangled in minification and thus
        // breaks sheet registration (which relies on the class name)
        keepNames: true,
      },

      build: {
        outDir: path.resolve(rootDir, "build"),
        emptyOutDir: true,
        sourcemap: mode !== "production" || sourceMap,
        minify: mode === "production",
        lib: {
          name: foundryPackageId,
          entry: `${kebabCaseToCamelCase(foundryPackageId)}.ts`,
          formats: ["es"],
          fileName: kebabCaseToCamelCase(foundryPackageId),
        },
      },

      optimizeDeps: {
        // this prevents a whole-page reload when we open the settings window
        // https://vitejs.dev/config/dep-optimization-options.html#optimizedeps-entries
        entries: ["src/index.ts", "src/components/settings/Settings.tsx"],
      },

      plugins: [
        ...plugins,
        includeReact &&
          react({
            jsxImportSource: "@emotion/react",
            plugins: [
              [
                "@swc/plugin-emotion",
                {
                  autoLabel: "always",
                },
              ],
            ],
          }),
        // svgr plugin uses SVGR to import SVGs as React components
        svgr({
          svgrOptions: {
            // use SVGO plugins to optimize the SVGs - this means we can use
            // SVGS direct from Inkscape with all the extra stuff, but they
            // get minified for use.
            plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
            // SVGR plugin has weird syntax for plugins, so we have to do this
            svgoConfig: {
              // these are plugins to *SVGO*
              plugins: [
                {
                  name: "preset-default",
                },
                // converts `style=color:red` to color=red
                {
                  name: "convertStyleToAttrs",
                },
                // and then we change every color to `currentColor` which means it
                // inherits the color from the parent element, so we can use it
                // inline with text (like an icon) or set a CSS color on the SVG
                // when we render it.
                {
                  name: "convertColors",
                  params: {
                    currentColor: true,
                  },
                },
              ],
            },
          },
        }),
        visualizer({
          gzipSize: true,
          template: "treemap",
          filename: "stats/treemap.html",
        }),
        compilePacks(),
      ],
    };
    // console.log("USER CONFIG", JSON.stringify(userConfig, null, 2));
    return userConfig;
  });

  // console.log("FINAL CONFIG", JSON.stringify(config, null, 2));
  return config;
}
