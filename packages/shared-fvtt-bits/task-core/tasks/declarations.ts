/**
 * See https://github.com/foundryvtt/foundryvtt-cli?tab=readme-ov-file#api
 */
declare module "@foundryvtt/foundryvtt-cli" {
  import { DumpOptions } from "js-yaml";

  //
  namespace compilePack {
    interface Options {
      nedb?: boolean;
      yaml?: boolean;
      log?: boolean;
      recursive?: boolean;
      transformEntry?: (entry: any) => Promise<false | void>;
    }
  }

  export function compilePack(
    from: string,
    to: string,
    options: compilePack.Options,
  ): Promise<string[]>;

  namespace extractPack {
    type NedbRelatedOptions =
      | {
          nedb: true;
          documentType: string;
        }
      | {
          nedb?: false;
        };

    interface CoreOptions {
      yaml?: boolean;
      log?: boolean;
      yamlOptions?: DumpOptions;
      jsonOptions?: object;
      transformEntry?: (entry: any) => Promise<false | void>;
      transformName?:
        | ((doc: any) => Promise<string | void>)
        | ((doc: any) => string | void);
    }

    type Options = CoreOptions & NedbRelatedOptions;
  }

  export function extractPack(
    from: string,
    to: string,
    options: extractPack.Options,
  ): Promise<string[]>;
}
