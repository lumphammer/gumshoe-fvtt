import type { ReactCompilerOptions } from "@vitejs/plugin-react";
import type { PluginOption } from "vite";

export type CreateFvttViteConfigArgs = {
  foundryPackageId: string;
  importMetaUrl: string;
  packageType: "module" | "system";
  port?: number;
  sourceMap?: boolean;
  includeReact?: boolean;
  /**
   * Where JSX comes from: `"react"`, or `"@emotion/react"` (the default) for
   * Emotion's `css` prop.
   */
  jsxImportSource?: string;
  /**
   * Run React Compiler over the code: `true`, or its options (e.g.
   * `{ compilationMode: "annotation" }` to compile only functions marked
   * `"use memo"`). Off by default.
   */
  reactCompiler?: boolean | ReactCompilerOptions;
  plugins?: PluginOption[];
  allowedHosts?: true | string[];
};
