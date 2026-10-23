/**
 * A document as `extractPacks` writes it to `src/packs`. Only the parts we
 * look at are typed.
 */
export interface PackDocument {
  _id: string;
  _key?: string;
  name: string;
  type?: string;
  system?: Record<string, any>;
  pages?: Array<{
    name: string;
    type?: string;
    text?: { content?: string | null };
  }>;
  [key: string]: unknown;
}

/** The strings Babele translates for one document. */
export interface BabeleEntry {
  name: string;
  pages?: Record<string, Record<string, string>>;
  [key: string]: unknown;
}

/** The shape of a Babele translation file, for one compendium. */
export interface BabeleFile {
  label: string;
  mapping?: Record<string, unknown>;
  entries: Record<string, BabeleEntry>;
  [key: string]: unknown;
}

/** pack name -> document id -> document name */
export type IdIndex = Record<string, Record<string, string>>;

export interface PackTranslationsConfig {
  /** Where `extractPacks` writes the pack sources. Default `src/packs`. */
  packSourcePath?: string;
  /**
   * Where to write the untranslated (source) files that Transifex reads.
   * Default `babele-sources`.
   */
  babeleSourcePath?: string;
  /**
   * The folder holding one folder of translations per language, i.e. the one
   * passed to Babele's `setSystemTranslationsDir` (or `register`), as a path
   * in the repo. Default `<publicPath>/lang/babele`.
   */
  translationsPath?: string;
  /** Which document types of pack to include. Default `["Item"]`. */
  packTypes?: string[];
  /**
   * Babele mappings by document type, written to `mappings.json` in
   * `translationsPath`, where Babele 2.8+ finds them. Use these rather than
   * a `mapping` in each file: Transifex would offer the field paths for
   * translation.
   */
  mappings?: Record<string, Record<string, unknown>>;
  /**
   * The strings to offer for translation for one document. `defaultEntry` is
   * the name (and, for journals, the pages).
   */
  entry?: (doc: PackDocument, defaultEntry: BabeleEntry) => BabeleEntry;
}

export interface PackLocation {
  rootPath: string;
  publicPath: string;
  manifestName: string;
}
