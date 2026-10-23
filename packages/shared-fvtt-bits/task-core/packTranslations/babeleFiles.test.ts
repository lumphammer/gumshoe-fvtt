import { describe, expect, it } from "vitest";

import {
  babeleFileName,
  buildBabeleSource,
  buildIdIndex,
  diffEntries,
  findRenames,
  planMoves,
  serializeJsonLike,
  translatablePacks,
  updateTranslation,
  updateTranslationText,
} from "./babeleFiles";
import type { BabeleFile, PackDocument } from "./types";

const manifest = {
  id: "investigator",
  version: "1",
  packs: [
    {
      name: "abilities",
      label: "Abilities",
      system: "investigator",
      path: "./packs/abilityFolder",
      type: "Item",
    },
    {
      name: "note",
      label: "Note",
      system: "investigator",
      path: "./packs/note",
      type: "JournalEntry",
    },
  ],
};
const [abilityPack] = manifest.packs;

const doc = (_id: string, name: string, extra: Partial<PackDocument> = {}) =>
  ({ _id, name, ...extra }) as PackDocument;

describe("babeleFileName", () => {
  it("uses the pack's name, not its folder", () => {
    expect(babeleFileName(manifest, abilityPack)).toBe(
      "investigator.abilities.json",
    );
  });
});

describe("translatablePacks", () => {
  it("defaults to Item packs", () => {
    expect(translatablePacks(manifest, {}).map((p) => p.name)).toEqual([
      "abilities",
    ]);
  });

  it("takes other pack types", () => {
    expect(
      translatablePacks(manifest, { packTypes: ["Item", "JournalEntry"] }).map(
        (p) => p.name,
      ),
    ).toEqual(["abilities", "note"]);
  });
});

describe("buildBabeleSource", () => {
  it("sorts entries by name, and uses the manifest label", () => {
    const source = buildBabeleSource(
      abilityPack,
      [doc("b", "Zoology"), doc("a", "anthropology"), doc("c", "Biology")],
      {},
    );
    expect(source).toEqual({
      label: "Abilities",
      entries: {
        anthropology: { name: "anthropology" },
        Biology: { name: "Biology" },
        Zoology: { name: "Zoology" },
      },
    });
  });

  it("includes journal pages", () => {
    const source = buildBabeleSource(
      abilityPack,
      [
        doc("a", "Note", {
          pages: [
            { name: "Page", text: { content: "<p>Hi</p>" } },
            { name: "Picture", type: "image" },
          ],
        }),
      ],
      {},
    );
    expect(source.entries["Note"]).toEqual({
      name: "Note",
      pages: {
        Page: { name: "Page", text: "<p>Hi</p>" },
        Picture: { name: "Picture" },
      },
    });
  });

  it("lets the config add fields", () => {
    const source = buildBabeleSource(
      abilityPack,
      [doc("a", "Law", { system: { categoryId: "Academic" } })],
      {
        entry: (d, base) => ({ ...base, category: d.system?.["categoryId"] }),
      },
    );
    expect(source.entries["Law"]).toEqual({
      name: "Law",
      category: "Academic",
    });
  });

  it("refuses two documents with the same name", () => {
    expect(() =>
      buildBabeleSource(abilityPack, [doc("a", "Law"), doc("b", "Law")], {}),
    ).toThrow(/more than one document called "Law"/);
  });
});

describe("findRenames", () => {
  it("finds documents whose names changed", () => {
    const renames = findRenames(
      { a: "Data Retrival", b: "Law" },
      { a: "Data Retrieval", b: "Law", c: "New" },
    );
    expect([...renames]).toEqual([["Data Retrival", "Data Retrieval"]]);
  });

  it("finds nothing on the first run", () => {
    expect(findRenames(undefined, { a: "Law" }).size).toBe(0);
  });
});

describe("buildIdIndex", () => {
  it("sorts packs and ids", () => {
    expect(
      JSON.stringify(
        buildIdIndex({ z: [doc("b", "B"), doc("a", "A")], y: [] }),
      ),
    ).toBe(JSON.stringify({ y: {}, z: { a: "A", b: "B" } }));
  });
});

const source: BabeleFile = {
  label: "Abilities",
  entries: {
    "Data Retrieval": { name: "Data Retrieval", category: "Technical" },
    Law: { name: "Law", category: "Academic" },
  },
};

const translation: BabeleFile = {
  label: "Compétences",
  mapping: { category: "system.category" },
  entries: {
    "Data Retrival": { name: "Récupération", category: "Technique" },
    Law: { name: "Droit", category: "Académique" },
  },
};

describe("updateTranslation", () => {
  it("moves translations to renamed keys and drops a stale mapping", () => {
    const updated = updateTranslation(
      translation,
      source,
      new Map([["Data Retrival", "Data Retrieval"]]),
    );
    expect(updated).toEqual({
      label: "Compétences",
      entries: {
        "Data Retrieval": { name: "Récupération", category: "Technique" },
        Law: { name: "Droit", category: "Académique" },
      },
    });
  });

  it("doesn't overwrite an existing translation of the new name", () => {
    const updated = updateTranslation(
      {
        ...translation,
        mapping: undefined,
        entries: {
          ...translation.entries,
          "Data Retrieval": { name: "Existing" },
        },
      },
      source,
      new Map([["Data Retrival", "Data Retrieval"]]),
    );
    expect(updated).toBeUndefined();
  });

  it("returns undefined when nothing changes", () => {
    const { mapping: _, ...withoutMapping } = translation;
    expect(updateTranslation(withoutMapping, source, new Map())).toBe(
      undefined,
    );
  });
});

const file = (...names: string[]): BabeleFile => ({
  label: "",
  entries: Object.fromEntries(names.map((n) => [n, { name: `fr ${n}` }])),
});

describe("planMoves", () => {
  it("swaps names", () => {
    const moves = planMoves(
      file("A", "B"),
      file("A", "B"),
      new Map([
        ["A", "B"],
        ["B", "A"],
      ]),
    );
    expect([...moves]).toEqual([
      ["A", "B"],
      ["B", "A"],
    ]);
  });

  it("follows a chain", () => {
    const moves = planMoves(
      file("A", "B"),
      file("B", "C"),
      new Map([
        ["A", "B"],
        ["B", "C"],
      ]),
    );
    expect([...moves]).toEqual([
      ["A", "B"],
      ["B", "C"],
    ]);
  });

  it("drops moves blocked by an entry that stays, and moves they block", () => {
    // B stays (its translation of the new name wins), so A can't move to
    // B, so C can't move to A
    const moves = planMoves(
      file("A", "B", "C"),
      file("A", "B"),
      new Map([
        ["A", "B"],
        ["C", "A"],
      ]),
    );
    expect(moves.size).toBe(0);
  });
});

describe("updateTranslation with swaps and chains", () => {
  it("swaps translations when names swap", () => {
    const updated = updateTranslation(
      file("A", "B"),
      file("A", "B"),
      new Map([
        ["A", "B"],
        ["B", "A"],
      ]),
    );
    expect(updated?.entries).toEqual({
      B: { name: "fr A" },
      A: { name: "fr B" },
    });
  });

  it("moves every translation along a chain", () => {
    const updated = updateTranslation(
      file("A", "B"),
      file("B", "C"),
      new Map([
        ["A", "B"],
        ["B", "C"],
      ]),
    );
    expect(updated?.entries).toEqual({
      B: { name: "fr A" },
      C: { name: "fr B" },
    });
  });
});

describe("updateTranslationText", () => {
  it("edits the text in place, keeping escapes and formatting", () => {
    const original = [
      "{",
      '    "label": "Comp\\u00e9tences",',
      '    "mapping": {',
      '        "category": "system.category"',
      "    },",
      '    "entries": {',
      '        "Data Retrival": {',
      '            "name": "R\\u00e9cup\\u00e9ration", "category": "Technique"',
      "        },",
      '        "Law": {"name": "Droit", "category": "Académique"}',
      "    }",
      "}",
    ].join("\n");
    expect(
      updateTranslationText(
        original,
        source,
        new Map([["Data Retrival", "Data Retrieval"]]),
      ),
    ).toBe(
      [
        "{",
        '    "label": "Comp\\u00e9tences",',
        '    "entries": {',
        '        "Data Retrieval": {',
        '            "name": "R\\u00e9cup\\u00e9ration", "category": "Technique"',
        "        },",
        '        "Law": {"name": "Droit", "category": "Académique"}',
        "    }",
        "}",
      ].join("\n"),
    );
  });

  it("swaps keys in place", () => {
    const original =
      '{"label": "L", "entries": {"A": {"name": "a"}, "B": {"name": "b"}}}';
    expect(
      updateTranslationText(
        original,
        file("A", "B"),
        new Map([
          ["A", "B"],
          ["B", "A"],
        ]),
      ),
    ).toBe(
      '{"label": "L", "entries": {"B": {"name": "a"}, "A": {"name": "b"}}}',
    );
  });

  it("removes a mapping that comes last", () => {
    const original = `{"label": "L", "entries": {}, "mapping": {"a": "b"}}`;
    expect(
      updateTranslationText(
        original.replace(/, "mapping"/, ',\n "mapping"'),
        { label: "L", entries: {} },
        new Map(),
      ),
    ).toBe(`{"label": "L", "entries": {}}`);
  });
});

describe("serializeJsonLike", () => {
  it("escapes the characters the original escaped", () => {
    expect(
      serializeJsonLike('{"a": "\\u00e9", "b": "ü"}\n', { a: "é", b: "ü" }),
    ).toBe('{\n    "a": "\\u00e9",\n    "b": "ü"\n}\n');
  });

  it("keeps a missing final newline", () => {
    expect(serializeJsonLike("{}", {})).toBe("{}");
  });
});

describe("diffEntries", () => {
  it("separates added, removed and renamed entries", () => {
    expect(
      diffEntries(
        {
          label: "",
          entries: { Old: { name: "Old" }, Gone: { name: "Gone" } },
        },
        { label: "", entries: { New: { name: "New" }, Fresh: { name: "F" } } },
        new Map([["Old", "New"]]),
      ),
    ).toEqual({
      added: ["Fresh"],
      removed: ["Gone"],
      renamed: [["Old", "New"]],
    });
  });
});
