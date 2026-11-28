// The JSON schemas for the types package's file formats (its README, "JSON
// schemas"), made by ts-json-schema-generator from the package's types, with
// two changes it can't make itself:
//
// - Styles (`ThemeStyle`, and V1's `CSSObject`) are open objects: from
//   csstype, they'd be megabytes of property unions. The generator reads a
//   copy of the types with those two rewritten.
// - The catalogue (`ThemeCatalogue`) is built from the recipes' shapes,
//   which the generator can't follow through `RecipeOverride`'s generics.
//
// Written and checked with the catalogue's other generated files
// (generateCatalogueShapes.ts).
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  createGenerator,
  type Definition as JSONSchema7Definition,
  type Schema as JSONSchema7,
} from "ts-json-schema-generator";

import {
  elementStates,
  stateLayers,
} from "../src/themes/catalogue/stateLayers";

/** A recipe's shape, as generateCatalogueShapes.ts works it out. */
export interface SchemaShape {
  slots: string[];
  variants: Record<string, string[]>;
  states: string[];
}

import { jsonSchemaBaseUrl as schemaBaseUrl } from "../src/constants";

const packageDir = join(
  import.meta.dirname,
  "../packages/investigator-fvtt-types",
);
export const schemasDir = "packages/investigator-fvtt-types/schemas";

const sources = ["index.ts", "themeV2.ts", "catalogue.generated.ts"];

/** Each rewrite of the copied types: a file, what to find, what to put. */
const rewrites: [string, RegExp, string][] = [
  [
    "themeV2.ts",
    /export type ThemeStyle = \{[^]*?\n\};\n/,
    "export type ThemeStyle = { [key: string]: unknown };\n",
  ],
  [
    "index.ts",
    /export interface CSSObject extends [^\n]*\{\}\n/,
    "export interface CSSObject { [key: string]: unknown }\n",
  ],
  [
    // its type, from before CSSObject was opened, spelt out: the generator
    // can't follow the `Extract` in CSSPropertiesWithMultiValues
    "index.ts",
    /displayFontTextTransform\?: CSSObject\["textTransform"\];/,
    "displayFontTextTransform?: CSS.Property.TextTransform | ReadonlyArray<CSS.Property.TextTransform>;",
  ],
];

const schemas: {
  file: string;
  type: string;
  title: string;
  description: string;
}[] = [
  {
    file: "preset-v1.schema.json",
    type: "PresetV1",
    title: "INVESTIGATOR preset (V1)",
    description:
      "A preset for INVESTIGATOR, the GUMSHOE system for Foundry VTT, as given to `CONFIG.Investigator.installPreset`.",
  },
  {
    file: "settings-export-v1.schema.json",
    type: "SettingsExportV1",
    title: "INVESTIGATOR settings export (V1)",
    description:
      "A file of INVESTIGATOR's settings, from Import/Export in its settings: what Import reads back.",
  },
  {
    file: "theme-v1.schema.json",
    type: "ThemeSeedV1",
    title: "INVESTIGATOR theme (V1)",
    description:
      "A V1 theme for INVESTIGATOR (superseded by V2), for the custom themes folder or `CONFIG.Investigator.installTheme`.",
  },
  {
    file: "theme-v2.schema.json",
    type: "ThemeV2",
    title: "INVESTIGATOR theme (V2)",
    description:
      "A theme for INVESTIGATOR, for the custom themes folder or `CONFIG.Investigator.installTheme`.",
  },
];

const style: JSONSchema7 = { $ref: "#/definitions/ThemeStyle" };
const stateLayerNames = Object.keys(stateLayers);
const elementStateNames = new Set(Object.keys(elementStates));

const closed = (
  properties: Record<string, JSONSchema7Definition>,
  extra: JSONSchema7 = {},
): JSONSchema7 => ({
  type: "object",
  properties,
  additionalProperties: false,
  ...extra,
});

/**
 * A variant's values in a compound variant: a boolean one's can be booleans
 * (either, as in `VariantValue`, even if the variant has only one value).
 */
const compoundValues = (values: string[]): JSONSchema7 => ({
  enum: values.some((value) => value === "true" || value === "false")
    ? [...values, true, false]
    : values,
});

const ref = (name: string): JSONSchema7 => ({ $ref: `#/definitions/${name}` });

/**
 * One recipe's override, and its parts, as definitions (each part is used
 * many times over): `<Name>Override`, and `<Name>Parts` (a slot recipe's
 * style for each slot), `<Name>States` and `<Name>Variant` (a variant
 * value's style).
 */
const recipeDefinitions = (
  name: string,
  shape: SchemaShape,
): [string, JSONSchema7][] => {
  const prefix = name[0].toUpperCase() + name.slice(1);
  const hasSlots = shape.slots.length > 0;
  const slotStyles = Object.fromEntries(
    shape.slots.map((slot) => [slot, style]),
  );
  /** A style: one for each slot, or one for a recipe without. */
  const parts = hasSlots ? ref(`${prefix}Parts`) : style;
  const states = ref(`${prefix}States`);
  const variants = Object.entries(shape.variants);
  const override = closed({
    base: parts,
    states,
    ...(variants.length > 0 && {
      variants: closed(
        Object.fromEntries(
          variants.map(([variant, values]) => [
            variant,
            closed(
              Object.fromEntries(
                values.map((value) => [value, ref(`${prefix}Variant`)]),
              ),
            ),
          ]),
        ),
      ),
      compoundVariants: {
        type: "array",
        items: closed(
          {
            ...Object.fromEntries(
              variants.map(([variant, values]) => [
                variant,
                compoundValues(values),
              ]),
            ),
            css: parts,
            states,
          },
          {
            // at least one variant, and its css, its states, or both (each
            // branch names what it requires, for Ajv's strict mode)
            allOf: [
              {
                anyOf: variants.map(([variant, values]) => ({
                  required: [variant],
                  properties: { [variant]: compoundValues(values) },
                })),
              },
              {
                anyOf: [
                  { required: ["css"], properties: { css: parts } },
                  { required: ["states"], properties: { states } },
                ],
              },
            ],
          },
        ),
      },
    }),
  });
  return [
    [`${prefix}Override`, override],
    ...(hasSlots
      ? [[`${prefix}Parts`, closed(slotStyles)] as [string, JSONSchema7]]
      : []),
    [
      `${prefix}States`,
      closed(
        Object.fromEntries(
          [...stateLayerNames, ...shape.states].map((state) => [state, parts]),
        ),
      ),
    ],
    ...(variants.length > 0
      ? [
          [
            `${prefix}Variant`,
            // a variant value's style, with its elements' states beside it
            // (a style is an open object: `allOf` only gives `states` its
            // shape)
            hasSlots
              ? closed({ ...slotStyles, states })
              : { type: "object", allOf: [style], properties: { states } },
          ] as [string, JSONSchema7],
        ]
      : []),
  ];
};

/**
 * `ThemeCatalogue` (the theme's `states`, and each recipe's override), and
 * the definitions it refers to.
 */
const catalogueDefinitions = (
  shapes: [string, SchemaShape][],
  description: string | undefined,
): [string, JSONSchema7][] => {
  for (const [name, shape] of shapes) {
    for (const state of shape.states) {
      if (!elementStateNames.has(state)) {
        throw new Error(`${name}: no such element state "${state}"`);
      }
    }
  }
  const recipes = shapes.map(([name, shape]) => ({
    name,
    definitions: recipeDefinitions(name, shape),
  }));
  return [
    [
      "ThemeCatalogue",
      closed(
        {
          states: closed(
            Object.fromEntries(stateLayerNames.map((layer) => [layer, style])),
          ),
          ...Object.fromEntries(
            recipes.map(({ name, definitions }) => [
              name,
              ref(definitions[0][0]),
            ]),
          ),
        },
        description ? { description } : {},
      ),
    ],
    ...recipes.flatMap(({ definitions }) => definitions),
  ];
};

/** The package's types, copied with the rewrites, to generate from. */
const copyTypes = () => {
  // in the package, so csstype resolves from its node_modules (and its own,
  // so runs at once don't share one)
  const cache = join(packageDir, "node_modules/.cache");
  mkdirSync(cache, { recursive: true });
  const dir = mkdtempSync(join(cache, "json-schemas-"));
  for (const file of sources) {
    cpSync(join(packageDir, file), join(dir, file));
  }
  for (const [file, find, replace] of rewrites) {
    const path = join(dir, file);
    const source = readFileSync(path, "utf8");
    if (!find.test(source)) {
      throw new Error(`jsonSchemas: ${file} has nothing matching ${find}`);
    }
    writeFileSync(path, source.replace(find, replace));
  }
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "esnext",
        module: "esnext",
        moduleResolution: "bundler",
        strict: true,
        lib: ["es2020", "dom"],
        noEmit: true,
        skipLibCheck: true,
      },
      include: sources,
    }),
  );
  return dir;
};

/**
 * The schemas, by file name (in `schemasDir`), as JSON, from the recipes'
 * shapes.
 */
export function buildJsonSchemas(
  shapes: [string, SchemaShape][],
): [string, string][] {
  const dir = copyTypes();
  try {
    const generator = createGenerator({
      path: join(dir, "index.ts"),
      tsconfig: join(dir, "tsconfig.json"),
      type: "*",
      topRef: false,
      jsDoc: "extended",
      additionalProperties: false,
      skipTypeCheck: true,
    });
    const files = schemas.map(({ file, type, title, description }) => {
      const generated = generator.createSchema(type);
      const { $schema, definitions, properties, ...rest } = generated;
      const catalogue = definitions?.["ThemeCatalogue"];
      if (definitions && catalogue !== undefined) {
        Object.assign(
          definitions,
          Object.fromEntries(
            catalogueDefinitions(
              shapes,
              typeof catalogue === "object" ? catalogue.description : undefined,
            ),
          ),
        );
      }
      const schema = {
        $schema,
        $id: `${schemaBaseUrl}${file}`,
        title,
        ...rest,
        description,
        properties: {
          $schema: {
            type: "string",
            description:
              "The schema for this file, so an editor can check it: ignored by INVESTIGATOR.",
          },
          ...properties,
        },
        definitions,
      } satisfies JSONSchema7;
      return [file, JSON.stringify(schema, null, 2)] as [string, string];
    });
    return [
      ...files,
      [
        "theme.schema.json",
        JSON.stringify(
          {
            $schema: "http://json-schema.org/draft-07/schema#",
            $id: `${schemaBaseUrl}theme.schema.json`,
            title: "INVESTIGATOR theme",
            description:
              "A theme for INVESTIGATOR, V1 or V2 (by its `schemaVersion`), for the custom themes folder or `CONFIG.Investigator.installTheme`.",
            type: "object",
            required: ["schemaVersion"],
            properties: { schemaVersion: { enum: ["v1", "v2"] } },
            if: {
              required: ["schemaVersion"],
              properties: { schemaVersion: { const: "v1" } },
            },
            then: { $ref: "theme-v1.schema.json" },
            else: { $ref: "theme-v2.schema.json" },
          } satisfies JSONSchema7,
          null,
          2,
        ),
      ],
    ];
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
