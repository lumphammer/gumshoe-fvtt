import { diff } from "jest-diff";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { pathOfCthulhuPreset } from "../../presets";
import { AnyAction } from "./reducerTools";
import { createSystemSlice } from "./store";
import { State } from "./types";

type TestTuple = [string, AnyAction];

const initialState: State = {
  settings: {
    pcStats: {
      pcStat0: {
        min: 0,
        max: 10,
        default: 3,
        name: "PC Statisitic Zero",
      },
    },
    npcStats: {
      npcStat0: {
        min: 0,
        max: 10,
        default: 3,
        name: "NPC Statisitic Zero",
      },
    },
    systemPreset: "dnd5e",
    combatAbilities: [],
    customThemePath: "",
    equipmentCategories: {
      category0: {
        name: "initial category",
        fields: {
          field0: {
            name: "Initial field",
            type: "string",
            default: "default value",
          },
          field1: {
            name: "Initial field",
            type: "number",
            min: 0,
            max: 10,
            default: 1,
          },
        },
      },
      category1: {
        name: "initial category",
        fields: {},
      },
    },
    debugTranslations: false,
    useBoost: false,
    defaultThemeName: "",
    useMwInjuryStatus: false,
    useMwStyleAbilities: false,
    useNpcCombatBonuses: false,
    generalAbilityCategories: [],
    migrationFlags: {
      actor: {},
      item: {},
      compendium: {},
      journal: {},
      macro: {},
      scene: {},
      rollTable: {},
      playlist: {},
      world: {},
    },
    migrationAttempts: 0,
    migrationLastError: "",
    useTurnPassingInitiative: false,
    genericOccupation: "",
    investigativeAbilityCategories: [],
    longNotes: [],
    mwHiddenShortNotes: [],
    mwUseAlternativeItemTypes: false,
    newNPCPacks: [],
    newPCPacks: [],
    occupationLabel: "",
    personalDetails: [],
    showEmptyInvestigativeCategories: false,
    systemMigrationVersion: "",
    // eslint-disable-next-line typescript/no-deprecated -- legacy migration fixture
    shortNotes: [],
    firstRun: true,
    journalMemories: {},
    cardCategories: [],
    useCards: false,
    notifyItemAddedToActor: false,
  },
};

// const initialStateJSON = JSON.stringify(initialState, null, 2);

// no-op used later to prevent jest-diff trying to color output
const noColor = (x: string) => x;

// options for jest-diff
const diffOptions = {
  // don't colourise the diff
  aColor: noColor,
  bColor: noColor,
  changeColor: noColor,
  commonColor: noColor,
  patchColor: noColor,
  // show 3 lines of context around each change
  contextLines: 3,
  // don't show the entire object in the diff
  expand: false,
  omitAnnotationLines: true,
  // keep object keys in the original order (so key order changes will be
  // detected)
  compareKeys: () => 0,
};

// mock the reducer callbacks
const logFn = vi.fn();
const onErrorFn = vi.fn();

const slice = createSystemSlice({
  log: logFn,
  onError: onErrorFn,
});

beforeEach(() => {
  logFn.mockReset();
  onErrorFn.mockReset();
});

// we need to mock nanoid so that we can predictably generate ids
// I tried putting this in beforeAll but for some reason we weren't seeing the
// mock in the test
vi.mock("nanoid", () => {
  let count = 0;
  return {
    __esModule: true,
    nanoid: () => "id" + count++,
  };
});

afterAll(() => {
  vi.resetModules();
});

/*
 * DIFF SNAPSHOT TESTS!
 *
 * Rather than maintain a manual list of expected values,
 * we can just snapshot the diff between the initial state and the state after
 * the action is applied. This means the tests are not super brittle in the
 * event of the structure changing, but it does require you to manually check
 * the diff to make sure it's what you expect.
 *
 * The snapshots are stored in the __snapshots__ folder.
 *
 * To update the snapshots, run `npx jest -u`
 *
 * AND PLEASE CHECK THE DIFFS AFTER UPDATING! Your git tool of choice will help
 * here, so you can just compare the diffs that have changed. Yes, it might feel
 * a bit weird looking at "diffs of diffs", but you'll get the hang of it.
 */
describe("reducer", () => {
  it("should ignore unknown actions", () => {
    const result = slice.reducer(initialState, { type: "FOOEY" });
    // no point snapshotting this
    expect(result).toEqual(initialState);
  });

  it("preserves sibling equipment fields when changing a field id", () => {
    const state = structuredClone(initialState);
    const fields = state.settings.equipmentCategories["category0"].fields;
    fields["field2"] = {
      name: "Third field",
      type: "checkbox",
      default: true,
    };

    const result = slice.reducer(
      state,
      slice.creators.changeFieldId({
        categoryId: "category0",
        fieldId: "field0",
        newFieldId: "renamedField",
      }),
    );
    const resultFields =
      result.settings.equipmentCategories["category0"].fields;

    expect(Object.keys(resultFields)).toEqual([
      "renamedField",
      "field1",
      "field2",
    ]);
    expect(resultFields).toStrictEqual({
      renamedField: fields["field0"],
      field1: fields["field1"],
      field2: fields["field2"],
    });
    expect(resultFields["renamedField"]).toBe(fields["field0"]);
    expect(resultFields["field1"]).toBe(fields["field1"]);
    expect(resultFields["field2"]).toBe(fields["field2"]);
  });

  it.each<TestTuple>([
    [
      "set a value using setSome",
      slice.creators.setSome({ newSettings: { genericOccupation: "foo" } }),
    ],
    ["add a category", slice.creators.addCategory()],
    ["delete a category", slice.creators.deleteCategory({ id: "category0" })],
    [
      "rename a category",
      slice.creators.renameCategory({ id: "category0", newName: "foo" }),
    ],
    [
      "change a category id",
      slice.creators.changeCategoryId({
        oldCategoryId: "category0",
        newCategoryId: "foo",
      }),
    ],
    [
      "move a category up",
      slice.creators.moveCategoryUp({ categoryId: "category1" }),
    ],
    [
      "move a category down",
      slice.creators.moveCategoryDown({ categoryId: "category0" }),
    ],
    ["add a field", slice.creators.addField({ categoryId: "category0" })],
    [
      "delete a field",
      slice.creators.deleteField({
        categoryId: "category0",
        fieldId: "field0",
      }),
    ],
    [
      "rename a field",
      slice.creators.renameField({
        categoryId: "category0",
        fieldId: "field0",
        newName: "foo",
      }),
    ],
    [
      "change a field id",
      slice.creators.changeFieldId({
        categoryId: "category0",
        fieldId: "field0",
        newFieldId: "foo",
      }),
    ],
    [
      "set a field type",
      slice.creators.setFieldType({
        categoryId: "category0",
        fieldId: "field0",
        newType: "number",
      }),
    ],
    [
      "set a field default",
      slice.creators.setFieldDefault({
        categoryId: "category0",
        fieldId: "field0",
        newDefault: "foo",
      }),
    ],
    [
      "set a field minimum",
      slice.creators.setFieldMin({
        categoryId: "category0",
        fieldId: "field1",
        newMin: 2,
      }),
    ],
    [
      "set a field maximum",
      slice.creators.setFieldMax({
        categoryId: "category0",
        fieldId: "field1",
        newMax: 2,
      }),
    ],
    [
      "apply a preset",
      slice.creators.applyPreset({
        preset: pathOfCthulhuPreset,
        presetId: "pathOfCthulhu",
      }),
    ],
    [
      "add a stat",
      slice.creators.addStat({
        which: "pcStats",
      }),
    ],
    [
      "set a stat minimum",
      slice.creators.setStatMin({
        which: "pcStats",
        statId: "pcStat0",
        newMin: 1,
      }),
    ],
    [
      "set a stat maximum",
      slice.creators.setStatMax({
        which: "pcStats",
        statId: "pcStat0",
        newMax: 1,
      }),
    ],
    [
      "move a field up",
      slice.creators.moveFieldUp({
        categoryId: "category0",
        fieldId: "field1",
      }),
    ],
    [
      "move a field down",
      slice.creators.moveFieldDown({
        categoryId: "category0",
        fieldId: "field0",
      }),
    ],
    [
      "set a stat default",
      slice.creators.setStatDefault({
        which: "pcStats",
        statId: "pcStat0",
        newDefault: 1,
      }),
    ],
    [
      "set a stat name",
      slice.creators.setStatName({
        which: "pcStats",
        statId: "pcStat0",
        newName: "foo",
      }),
    ],
    [
      "delete a stat",
      slice.creators.deleteStat({
        which: "pcStats",
        statId: "pcStat0",
      }),
    ],
    [
      "set a stat id",
      slice.creators.setStatId({
        which: "pcStats",
        oldStatId: "pcStat0",
        newStatId: "foo",
      }),
    ],
  ])("should %s", (name, action) => {
    // * why snapshots of diffs?
    //   * they're smaller and easier to read than snapshotting the entire
    //     output object. You can peruse the snapshots file and see the
    //     *changes* caused by the action, rather than the entire state.
    // * why a patch formatted diff?
    //   * first attempt used an object diff (from `just-diff`) but that does
    //     not detect changes in key order.
    const result = slice.reducer(initialState, action);
    const diffs = diff(initialState, result, diffOptions);
    expect(diffs).toMatchSnapshot();
    expect(onErrorFn).not.toHaveBeenCalled();
    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn).toHaveBeenCalledWith(action, initialState, result);
  });

  // error cases
  it.each<TestTuple>([
    [
      "moving a category up when it's already at the top",
      slice.creators.moveCategoryUp({ categoryId: "category0" }),
    ],
    [
      "moving a category down when it's already at the bottom",
      slice.creators.moveCategoryDown({ categoryId: "category1" }),
    ],
    [
      "moving a field up when it's already at the top",
      slice.creators.moveFieldUp({
        categoryId: "category0",
        fieldId: "field0",
      }),
    ],
    [
      "moving a field down when it's already at the bottom",
      slice.creators.moveFieldDown({
        categoryId: "category0",
        fieldId: "field1",
      }),
    ],
    [
      "setting a field minimum to a value greater than its maximum",
      slice.creators.setFieldMin({
        categoryId: "category0",
        fieldId: "field1",
        newMin: 20,
      }),
    ],
    [
      "setting a stat minimum to a value greater than its maximum",
      slice.creators.setStatMin({
        which: "pcStats",
        statId: "pcStat0",
        newMin: 20,
      }),
    ],
    [
      "setting a stat maximum to a value less than its minimum",
      slice.creators.setStatMax({
        which: "pcStats",
        statId: "pcStat0",
        newMax: -10,
      }),
    ],
    [
      "changing a catrgory id to one that already exists",
      slice.creators.changeCategoryId({
        oldCategoryId: "category0",
        newCategoryId: "category1",
      }),
    ],
    [
      "changing a field id to one that already exists",
      slice.creators.changeFieldId({
        categoryId: "category0",
        fieldId: "field0",
        newFieldId: "field1",
      }),
    ],
    [
      "setting a numeric default for a string field",
      slice.creators.setFieldDefault({
        categoryId: "category0",
        fieldId: "field0",
        newDefault: 1,
      }),
    ],
    [
      "setting a boolean default for a string field",
      slice.creators.setFieldDefault({
        categoryId: "category0",
        fieldId: "field0",
        newDefault: true,
      }),
    ],
    [
      "setting a string default for a numeric field",
      slice.creators.setFieldDefault({
        categoryId: "category0",
        fieldId: "field1",
        newDefault: "foo",
      }),
    ],
    [
      "setting a boolean default for a numeric field",
      slice.creators.setFieldDefault({
        categoryId: "category0",
        fieldId: "field1",
        newDefault: true,
      }),
    ],
    [
      "deliberately throwing an error",
      slice.creators.throwError({
        message: "foo",
      }),
    ],
  ])("should error when %s", (name, action) => {
    const result = slice.reducer(initialState, action);
    expect(result).toEqual(initialState);
    expect(logFn).not.toHaveBeenCalled();
    expect(onErrorFn).toHaveBeenCalledTimes(1);
  });
});
