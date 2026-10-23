import type { Manifest, PackDefinition } from "../types";
import type {
  BabeleEntry,
  BabeleFile,
  IdIndex,
  PackDocument,
  PackTranslationsConfig,
} from "./types";

export const ID_INDEX_FILE_NAME = "ids.json";
export const MAPPINGS_FILE_NAME = "mappings.json";

const compareNames = (a: string, b: string) => a.localeCompare(b, "en");

/** Babele finds a compendium's translations by `<package id>.<pack name>`. */
export function babeleFileName(manifest: Manifest, pack: PackDefinition) {
  return `${manifest.id}.${pack.name}.json`;
}

export function serializeJson(data: unknown) {
  return `${JSON.stringify(data, null, 4)}\n`;
}

/**
 * Serialize a translated file the way it was written (by Transifex, usually),
 * so editing it doesn't change every line: characters it mostly wrote as `\u`
 * escapes stay escaped, and it keeps its final newline, or lack of one.
 */
export function serializeJsonLike(original: string, data: unknown) {
  const counts = new Map<string, number>();
  for (const m of original.matchAll(/\\u([0-9a-fA-F]{4})/g)) {
    const c = String.fromCharCode(parseInt(m[1], 16));
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  for (const c of original.match(/[\u0080-\uffff]/g) ?? []) {
    counts.set(c, (counts.get(c) ?? 0) - 1);
  }
  const json = JSON.stringify(data, null, 4).replace(/[\u0080-\uffff]/g, (c) =>
    (counts.get(c) ?? 0) > 0
      ? `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`
      : c,
  );
  return original.endsWith("\n") ? `${json}\n` : json;
}

export function translatablePacks(
  manifest: Manifest,
  config: PackTranslationsConfig,
) {
  const packTypes = config.packTypes ?? ["Item"];
  return (manifest.packs ?? []).filter((pack) => packTypes.includes(pack.type));
}

export function defaultEntry(doc: PackDocument): BabeleEntry {
  const entry: BabeleEntry = { name: doc.name };
  const pages: Record<string, Record<string, string>> = {};
  for (const page of doc.pages ?? []) {
    const content = page.text?.content;
    pages[page.name] = {
      name: page.name,
      ...(content ? { text: content } : {}),
    };
  }
  if (Object.keys(pages).length > 0) {
    entry.pages = pages;
  }
  return entry;
}

/** Build the source file for one pack. Throws if two documents share a name. */
export function buildBabeleSource(
  pack: PackDefinition,
  docs: PackDocument[],
  config: PackTranslationsConfig,
): BabeleFile {
  const sorted = [...docs].sort((a, b) => compareNames(a.name, b.name));
  const entries: Record<string, BabeleEntry> = {};
  for (const doc of sorted) {
    if (doc.name in entries) {
      throw new Error(
        `Pack ${pack.name} has more than one document called "${doc.name}". Babele matches translations by name, so they need different names.`,
      );
    }
    const base = defaultEntry(doc);
    entries[doc.name] = config.entry ? config.entry(doc, base) : base;
  }
  return { label: pack.label, entries };
}

export function buildIdIndex(
  packDocs: Record<string, PackDocument[]>,
): IdIndex {
  const index: IdIndex = {};
  for (const packName of Object.keys(packDocs).sort(compareNames)) {
    const docs = [...packDocs[packName]].sort((a, b) =>
      a._id < b._id ? -1 : a._id > b._id ? 1 : 0,
    );
    index[packName] = Object.fromEntries(docs.map((d) => [d._id, d.name]));
  }
  return index;
}

/**
 * Names that changed between two runs, as old name -> new name, so their
 * translations can follow them.
 */
export function findRenames(
  oldIds: Record<string, string> | undefined,
  newIds: Record<string, string>,
) {
  const renames = new Map<string, string>();
  for (const [id, newName] of Object.entries(newIds)) {
    const oldName = oldIds?.[id];
    if (oldName !== undefined && oldName !== newName) {
      renames.set(oldName, newName);
    }
  }
  return renames;
}

export function mappingsMatch(translation: BabeleFile, source: BabeleFile) {
  return (
    JSON.stringify(translation.mapping ?? null) ===
    JSON.stringify(source.mapping ?? null)
  );
}

/**
 * Bring a translated file into line with its source: carry translations over
 * to renamed documents, and make its `mapping` match (a `mapping` in a file
 * overrides the one in `mappings.json`). Returns `undefined` if nothing
 * changed.
 */
export function updateTranslation(
  translation: BabeleFile,
  source: BabeleFile,
  renames: Map<string, string>,
): BabeleFile | undefined {
  let changed = false;
  const entries: Record<string, BabeleEntry> = {};
  for (const [key, entry] of Object.entries(translation.entries ?? {})) {
    const newKey = renames.get(key);
    if (
      newKey !== undefined &&
      !(newKey in (translation.entries ?? {})) &&
      newKey in source.entries
    ) {
      entries[newKey] = entry;
      changed = true;
    } else {
      entries[key] = entry;
    }
  }
  const updated: BabeleFile = { ...translation, entries };
  if (!mappingsMatch(translation, source)) {
    if (source.mapping === undefined) {
      delete updated.mapping;
    } else {
      updated.mapping = source.mapping;
    }
    changed = true;
  }
  return changed ? updated : undefined;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const asciiJsonString = (s: string) =>
  JSON.stringify(s).replace(
    /[\u0080-\uffff]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );

/**
 * `updateTranslation`, but returning the file's new text. Where it can, it
 * edits the original text rather than re-serializing it, so that a file
 * written by Transifex only changes where it has to.
 */
export function updateTranslationText(
  original: string,
  source: BabeleFile,
  renames: Map<string, string>,
): string | undefined {
  const translation = JSON.parse(original) as BabeleFile;
  const updated = updateTranslation(translation, source, renames);
  if (updated === undefined) {
    return undefined;
  }
  let text: string | undefined = original;
  if (!mappingsMatch(translation, source)) {
    text =
      source.mapping === undefined
        ? text
            .replace(/\n[ \t]*"mapping"\s*:\s*\{[^{}]*\}\s*,(?=\s*\n)/, "")
            .replace(/,(\s*\n[ \t]*"mapping"\s*:\s*\{[^{}]*\})(?=\s*\})/, "")
        : undefined;
  }
  for (const [from, to] of renames) {
    if (text === undefined) {
      break;
    }
    if (!(to in updated.entries) || from in updated.entries) {
      continue;
    }
    const encodings: Array<[string, string]> = [
      [JSON.stringify(from), JSON.stringify(to)],
      [asciiJsonString(from), asciiJsonString(to)],
    ];
    const match = encodings.find(([encoded]) =>
      new RegExp(`${escapeRegExp(encoded)}\\s*:`).test(text ?? ""),
    );
    text = match
      ? text.replace(
          new RegExp(`${escapeRegExp(match[0])}(\\s*:)`),
          (_, colon: string) => `${match[1]}${colon}`,
        )
      : undefined;
  }
  try {
    if (
      text !== undefined &&
      JSON.stringify(JSON.parse(text)) === JSON.stringify(updated)
    ) {
      return text;
    }
  } catch {
    // fall through to re-serializing
  }
  return serializeJsonLike(original, updated);
}

/** Keys in `before` but not `after`, and vice versa. */
export function diffEntries(
  before: BabeleFile | undefined,
  after: BabeleFile,
  renames: Map<string, string>,
) {
  const beforeKeys = new Set(Object.keys(before?.entries ?? {}));
  const afterKeys = new Set(Object.keys(after.entries));
  const renamedTo = new Set(renames.values());
  return {
    added: [...afterKeys].filter(
      (k) => !beforeKeys.has(k) && !renamedTo.has(k),
    ),
    removed: [...beforeKeys].filter(
      (k) => !afterKeys.has(k) && !renames.has(k),
    ),
    renamed: [...renames].filter(
      ([from, to]) => beforeKeys.has(from) && afterKeys.has(to),
    ),
  };
}
