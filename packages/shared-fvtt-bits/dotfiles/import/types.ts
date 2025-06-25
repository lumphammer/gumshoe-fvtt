import type { PluginOption } from "vite";

export type CreateFvttViteConfigArgs = {
  foundryPackageId: string;
  importMetaUrl: string;
  packageType: "module" | "system";
  port?: number;
  sourceMap?: boolean;
  includeReact?: boolean;
  plugins?: PluginOption[];
  allowedHosts?: true | string[];
};
