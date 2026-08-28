import { CardCategory, PresetV1 } from "@lumphammer/investigator-fvtt-types";
import { nanoid } from "nanoid";

import {
  assertUniqueIds,
  getDevMode,
  moveKeyDown,
  moveKeyUp,
  renameProperty,
  systemLogger,
} from "../../functions/utilities";
import { pathOfCthulhuPreset } from "../../presets";
import { SettingsDict } from "../../settings/settings";
import { EquipmentFieldType } from "../../types";
import { assertNumericFieldOkayness } from "./functions";
import { createSlice, CreateSliceArgs } from "./reducerTools";
import { PcOrNpc, State } from "./types";

const defaultStoreArgs: CreateSliceArgs = {
  log(...args) {
    if (getDevMode()) {
      systemLogger.log(...args);
    }
  },
  onError(e) {
    systemLogger.error("Reducer error", e);
    if (ui && e instanceof Error) {
      ui.notifications?.error(`Settings error: ${e.toString()}`, {
        permanent: true,
      });
    }
  },
};

export const createSystemSlice = (args: CreateSliceArgs) =>
  createSlice<State>(args)({
    setSome: (draft, payload: { newSettings: Partial<SettingsDict> }) => {
      if (payload.newSettings.cardCategories !== undefined) {
        assertUniqueIds(
          payload.newSettings.cardCategories.map(({ id }) => id),
          "card category ID",
        );
      }
      Object.assign(draft.settings, payload.newSettings);
    },
    addCategory: (draft: State) => {
      draft.settings.equipmentCategories[nanoid()] = {
        name: "New category",
        fields: {},
      };
    },
    deleteCategory: (
      { settings: { equipmentCategories } }: State,
      { id }: { id: string },
    ) => {
      delete equipmentCategories[id];
    },
    renameCategory: (
      { settings: { equipmentCategories: cats } }: State,
      payload: { id: string; newName: string },
    ) => {
      cats[payload.id].name = payload.newName;
    },
    changeCategoryId: (
      { settings }: State,
      payload: { oldCategoryId: string; newCategoryId: string },
    ) => {
      settings.equipmentCategories = renameProperty(
        payload.oldCategoryId,
        payload.newCategoryId,
        settings.equipmentCategories,
        "equipment category ID",
      );
    },
    moveCategoryUp: (
      { settings }: State,
      { categoryId }: { categoryId: string },
    ) => {
      settings.equipmentCategories = moveKeyUp(
        settings.equipmentCategories,
        categoryId,
      );
    },
    moveCategoryDown: (
      { settings }: State,
      { categoryId }: { categoryId: string },
    ) => {
      settings.equipmentCategories = moveKeyDown(
        settings.equipmentCategories,
        categoryId,
      );
    },
    addField: (
      { settings: { equipmentCategories: cats } }: State,
      payload: { categoryId: string },
    ) => {
      cats[payload.categoryId].fields[nanoid()] = {
        name: "New Field",
        type: "string",
        default: "",
      };
    },
    deleteField: (
      { settings: { equipmentCategories: cats } }: State,
      payload: { categoryId: string; fieldId: string },
    ) => {
      delete cats[payload.categoryId].fields[payload.fieldId];
    },
    renameField: (
      { settings }: State,
      payload: { categoryId: string; fieldId: string; newName: string },
    ) => {
      settings.equipmentCategories[payload.categoryId].fields[
        payload.fieldId
      ].name = payload.newName;
    },
    changeFieldId: (
      { settings: { equipmentCategories: cats } }: State,
      payload: { categoryId: string; fieldId: string; newFieldId: string },
    ) => {
      cats[payload.categoryId].fields = renameProperty(
        payload.fieldId,
        payload.newFieldId,
        cats[payload.categoryId].fields,
        "equipment field ID",
      );
    },

    setFieldType: (
      { settings: { equipmentCategories: cats } }: State,
      payload: {
        categoryId: string;
        fieldId: string;
        newType: EquipmentFieldType;
      },
    ) => {
      const field = cats[payload.categoryId].fields[payload.fieldId];
      field.type = payload.newType;
      if (payload.newType === "number") {
        field.default = 0;
      } else if (payload.newType === "checkbox") {
        field.default = false;
      } else if (payload.newType === "string") {
        field.default = "";
      }
    },
    setFieldDefault: (
      { settings: { equipmentCategories: cats } }: State,
      payload: {
        categoryId: string;
        fieldId: string;
        newDefault: string | number | boolean;
      },
    ) => {
      const field = cats[payload.categoryId].fields[payload.fieldId];
      if (
        (field.type === "string" && typeof payload.newDefault !== "string") ||
        (field.type === "number" && typeof payload.newDefault !== "number") ||
        (field.type === "checkbox" && typeof payload.newDefault !== "boolean")
      ) {
        throw new Error(
          `Invalid default value ${payload.newDefault} for field type ${field.type}`,
        );
      }
      field.default = payload.newDefault;
    },
    setFieldMin: (
      { settings: { equipmentCategories: cats } }: State,
      payload: {
        categoryId: string;
        fieldId: string;
        newMin: number | undefined;
      },
    ) => {
      const field = cats[payload.categoryId].fields[payload.fieldId];
      assertNumericFieldOkayness(field, payload.fieldId, payload.newMin);
      if (
        field.max !== undefined &&
        payload.newMin !== undefined &&
        payload.newMin > field.max
      ) {
        throw new Error("Min cannot be greater than max");
      }
      field.min = payload.newMin;
    },
    setFieldMax: (
      { settings: { equipmentCategories: cats } }: State,
      payload: {
        categoryId: string;
        fieldId: string;
        newMax: number | undefined;
      },
    ) => {
      const field = cats[payload.categoryId].fields[payload.fieldId];
      assertNumericFieldOkayness(field, payload.fieldId, payload.newMax);
      if (
        field.min !== undefined &&
        payload.newMax !== undefined &&
        payload.newMax < field.min
      ) {
        throw new Error("Max cannot be less than min");
      }
      field.max = payload.newMax;
    },
    moveFieldUp: (
      { settings: { equipmentCategories: cats } }: State,
      { categoryId, fieldId }: { categoryId: string; fieldId: string },
    ) => {
      cats[categoryId].fields = moveKeyUp(cats[categoryId].fields, fieldId);
    },
    moveFieldDown: (
      { settings: { equipmentCategories: cats } }: State,
      { categoryId, fieldId }: { categoryId: string; fieldId: string },
    ) => {
      cats[categoryId].fields = moveKeyDown(cats[categoryId].fields, fieldId);
    },
    applyPreset: (
      draft: State,
      payload: { preset: PresetV1; presetId: string },
    ) => {
      draft.settings = {
        // start with the current temp settings - this way we keep any values
        // not handled by the presets
        ...draft.settings,
        // now we layer in a safe default. This is typed as Required<> so it
        // will always contain one of everything that can be controlled by a
        // preset.
        ...pathOfCthulhuPreset,
        // now layer in the actual preset
        ...payload.preset,
        // and finally, set the actual preset id
        systemPreset: payload.presetId,
      };
      assertUniqueIds(
        draft.settings.cardCategories.map(({ id }) => id),
        "card category ID",
      );
    },
    addStat: (draft: State, { which }: { which: PcOrNpc }) => {
      let suffix = Object.keys(draft.settings[which]).length;
      while (Object.hasOwn(draft.settings[which], `stat${suffix}`)) {
        suffix += 1;
      }
      const newId = `stat${suffix}`;
      draft.settings[which][newId] = { name: "", default: 0 };
    },
    setStatMin: (
      draft: State,
      {
        which,
        statId,
        newMin,
      }: { which: PcOrNpc; statId: string; newMin: number | undefined },
    ) => {
      const max = draft.settings[which][statId].max;
      if (max !== undefined && newMin !== undefined && newMin > max) {
        throw new Error("Min cannot be greater than max");
      }
      draft.settings[which][statId].min = newMin;
    },
    setStatMax: (
      draft: State,
      {
        which,
        statId,
        newMax,
      }: { which: PcOrNpc; statId: string; newMax: number | undefined },
    ) => {
      const min = draft.settings[which][statId].min;
      if (min !== undefined && newMax !== undefined && newMax < min) {
        throw new Error("Max cannot be less than min");
      }
      draft.settings[which][statId].max = newMax;
    },
    setStatDefault: (
      draft: State,
      {
        which,
        statId,
        newDefault,
      }: { which: PcOrNpc; statId: string; newDefault: number },
    ) => {
      draft.settings[which][statId].default = newDefault;
    },
    setStatName: (
      draft: State,
      {
        which,
        statId,
        newName,
      }: { which: PcOrNpc; statId: string; newName: string },
    ) => {
      draft.settings[which][statId].name = newName;
    },
    deleteStat: (
      draft: State,
      { which, statId }: { which: PcOrNpc; statId: string },
    ) => {
      delete draft.settings[which][statId];
    },
    setStatId: (
      draft: State,
      {
        which,
        oldStatId,
        newStatId,
      }: { which: PcOrNpc; oldStatId: string; newStatId: string },
    ) => {
      draft.settings[which] = renameProperty(
        oldStatId,
        newStatId,
        draft.settings[which],
        "stat ID",
      );
    },
    throwError: (draft: State, { message }: { message: string }) => {
      throw new Error(message);
    },
    addCardCategory: (draft: State, payload: { id: string }) => {
      assertUniqueIds(
        [...draft.settings.cardCategories.map(({ id }) => id), payload.id],
        "card category ID",
      );
      draft.settings.cardCategories.push({
        id: payload.id,
        singleName: "New category",
        pluralName: "New category",
        threshold: 3,
        thresholdType: "none",
      });
    },
    renameCardCategory: (
      draft: State,
      { id, newName }: { id: string; newName: string },
    ) => {
      draft.settings.cardCategories.find((c) => c.id === id)!.singleName =
        newName;
    },
    deleteCardCategory: (draft: State, { id }: { id: string }) => {
      draft.settings.cardCategories = draft.settings.cardCategories.filter(
        (c) => c.id !== id,
      );
    },
    setCardCategoryId: (
      draft: State,
      { id, newId }: { id: string; newId: string },
    ) => {
      const categoryIndex = draft.settings.cardCategories.findIndex(
        (category) => category.id === id,
      );
      const category = draft.settings.cardCategories[categoryIndex];
      assertUniqueIds(
        draft.settings.cardCategories.map((candidate, index) =>
          index === categoryIndex ? newId : candidate.id,
        ),
        "card category ID",
      );
      category.id = newId;
    },
    setCardCategories: (
      draft: State,
      { newCardCategories }: { newCardCategories: CardCategory[] },
    ) => {
      assertUniqueIds(
        newCardCategories.map(({ id }) => id),
        "card category ID",
      );
      draft.settings.cardCategories = newCardCategories;
    },
  });

export const store = createSystemSlice(defaultStoreArgs);
