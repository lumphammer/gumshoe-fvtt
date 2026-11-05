import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Call sites apply catalogue classes; only the catalogue reads the palette
// (docs/theming.md, rule 1). These files still read a theme's colours
// directly, from before the catalogue. The list only shrinks: when you convert
// one, take it off.
//
// A source scan, like schemaInitialValues.test.ts: it looks for `.colors`.

const notYetConverted = [
  "components/abilities/AbilityTestMW.tsx",
  "components/abilities/PoolCheckbox.tsx",
  "components/bonds/AdaptationTracker.tsx",
  "components/bonds/BondActor.tsx",
  "components/bonds/BondRow.tsx",
  "components/bonds/BondsArea.tsx",
  "components/cards/CardArray.tsx",
  "components/cards/CategorizedCardArrayCategory.tsx",
  "components/cards/UncategorizedCardArray.tsx",
  "components/characters/AbilitiesAreaEdit.tsx",
  "components/characters/AbilitiesAreaPlay.tsx",
  "components/characters/BuildPointsBar.tsx",
  "components/characters/CharacterSheetSimple.tsx",
  "components/characters/Equipment/EquipmentCategory.tsx",
  "components/characters/Equipment/EquipmentItemRow.tsx",
  "components/characters/MoribundWorld/MwItemGroup.tsx",
  "components/characters/SettingsArea.tsx",
  "components/characters/Slug.tsx",
  "components/characters/Weapons/WeaponRowEdit.tsx",
  "components/characters/Weapons/WeaponRow.tsx",
  "components/characters/Weapons/WeaponsArea.tsx",
  "components/contacts/NetworkContactRow.tsx",
  "components/contacts/NetworkContactsArea.tsx",
  "components/CSSReset.tsx",
  "components/ImagePickerLink.tsx",
  "components/ImagePickle.tsx",
  "components/inputs/Checkbox.tsx",
  "components/inputs/CheckButtons.tsx",
  "components/inputs/Hint.tsx",
  "components/inputs/RichTextEditor.tsx",
  "components/inputs/TextInput.tsx",
  "components/inputs/Toggle.tsx",
  "components/journalEditorSheet/ImageArea.tsx",
  "components/journalEditorSheet/magicToolbar/ToolbarButton.tsx",
  "components/journalEditorSheet/PageNavigation.tsx",
  "components/nestedPanels/ArrowLink.tsx",
  "components/nestedPanels/NestedPanel.tsx",
  "components/party/AbilityRow.tsx",
  "components/party/PartySheet.tsx",
  "components/settings/Abilities/AbilityPacksSettings.tsx",
  "components/settings/SettingsEmptyState.tsx",
  "components/settings/SettingsGridField.tsx",
  "components/settings/SettingsMenuLink.tsx",
  "components/settings/SettingsNote.tsx",
  "components/settings/Settings.tsx",
  "components/settings/useListHoverBg.ts",
  "components/sortableTable/DragHandle.tsx",
  "components/Suspense.tsx",
  "startup/loadCustomThemes.ts",
];

// The native world: our parts of Foundry's own UI, which look like Foundry
// and never read the theme at all, not even its fonts (docs/theming.md).
const nativeWorld = [
  /^components\/messageCards\//,
  /^components\/combat\//,
  /^components\/native\//,
  /^components\/inputs\/NativeMenu\//,
  /^components\/GamePauseBanner\.tsx$/,
];

const srcDir = join(import.meta.dirname, "../..");

const sourceFiles = () =>
  readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .map((path) => path.replaceAll("\\", "/"))
    .filter(
      (path) =>
        /\.tsx?$/.test(path) &&
        !/\.test(-d)?\.tsx?$/.test(path) &&
        // themes define colours; styled-system is generated
        !/^(themes|styled-system)\//.test(path),
    );

const filesMatching = (pattern: RegExp) =>
  sourceFiles()
    .filter((path) => pattern.test(readFileSync(join(srcDir, path), "utf8")))
    .sort();

const filesReadingColours = () => filesMatching(/\.colors\b/);

describe("reading theme colours", () => {
  it("happens only in files that haven't been converted yet", () => {
    const reading = filesReadingColours();
    // new ones: use a catalogue class instead
    expect(reading.filter((path) => !notYetConverted.includes(path))).toEqual(
      [],
    );
    // converted ones: take them off the list
    expect(notYetConverted.filter((path) => !reading.includes(path))).toEqual(
      [],
    );
  });
});

describe("the native world", () => {
  it("never reads the theme", () => {
    expect(
      filesMatching(/\b(ThemeContext|useTheme)\b|\.colors\b/).filter((path) =>
        nativeWorld.some((area) => area.test(path)),
      ),
    ).toEqual([]);
  });
});
