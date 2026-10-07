import { useNavigationContext, useParams } from "@lumphammer/minirouter";
import type React from "react";
import { useCallback, useContext } from "react";

import { confirmADoodleDo } from "../../../functions/confirmADoodleDo";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { InputGrid } from "../../inputs/InputGrid";
import { Select } from "../../inputs/Select";
import { Translate } from "../../Translate";
import { DispatchContext, ModifyContext } from "../contexts";
import { useStateSelector } from "../hooks";
import { SettingsGridField } from "../SettingsGridField";
import { SettingsIdField } from "../SettingsIdField";
import { store } from "../store";
import { cardCategory } from "./directions";

export const CardCategorySettings = () => {
  const index = useParams(cardCategory);
  const dispatch = useContext(DispatchContext);
  const modify = useContext(ModifyContext);
  const { navigate } = useNavigationContext();
  const { value: category, freeze } = useStateSelector(
    (s) => s.settings.cardCategories[index],
  );

  const handleSingleNameChange = useCallback(
    (newName: string) => {
      modify((s) => {
        s.cardCategories[index].singleName = newName;
      });
    },
    [index, modify],
  );

  const handlePluralNameChange = useCallback(
    (newName: string) => {
      modify((s) => {
        s.cardCategories[index].pluralName = newName;
      });
    },
    [index, modify],
  );

  const handleStyleKeyChange = useCallback(
    (newStyleKey: string) => {
      modify((s) => {
        s.cardCategories[index].styleKey = newStyleKey;
      });
    },
    [index, modify],
  );

  const handleThresholdChange = useCallback(
    (newThreshold: number) => {
      modify((s) => {
        s.cardCategories[index].threshold = newThreshold;
      });
    },
    [index, modify],
  );

  const handleThresholdTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newThresholdType = e.currentTarget.value as
        "none" | "goal" | "limit";
      modify((s) => {
        s.cardCategories[index].thresholdType = newThresholdType;
      });
    },
    [index, modify],
  );

  const handleChangeId = useCallback(
    (newId: string) => {
      if (category === undefined) return;
      dispatch(store.creators.setCardCategoryId({ id: category.id, newId }));
    },
    [category, dispatch],
  );

  const handleClickDelete = useCallback(async () => {
    if (category === undefined) return;
    const aye = await confirmADoodleDo({
      message: "DeleteCardCategoryName",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: { Name: category.singleName || category.id },
    });
    if (aye) {
      // keep showing this category while the panel animates out, rather than
      // whatever slides into its index
      freeze();
      navigate("here", "up");
      dispatch(store.creators.deleteCardCategory({ id: category.id }));
    }
  }, [category, dispatch, freeze, navigate]);

  if (category === undefined) {
    return null;
  }

  const thresholdType = category.thresholdType ?? "none";

  return (
    <InputGrid>
      <SettingsGridField label="ItemNameSingle">
        <AsyncTextInput
          value={category.singleName}
          onChange={handleSingleNameChange}
        />
      </SettingsGridField>
      <SettingsGridField label="ItemNamePlural">
        <AsyncTextInput
          value={category.pluralName}
          onChange={handlePluralNameChange}
        />
      </SettingsGridField>
      <SettingsGridField label="StyleKey">
        <AsyncTextInput
          value={category.styleKey ?? ""}
          onChange={handleStyleKeyChange}
        />
      </SettingsGridField>
      <SettingsGridField label="GoalOrLimit">
        <Select value={thresholdType} onChange={handleThresholdTypeChange}>
          <option value="none">
            <Translate>None</Translate>
          </option>
          <option value="goal">
            <Translate>Goal</Translate>
          </option>
          <option value="limit">
            <Translate>Limit</Translate>
          </option>
        </Select>
      </SettingsGridField>
      {thresholdType !== "none" && (
        <SettingsGridField label={thresholdType === "goal" ? "Goal" : "Limit"}>
          <AsyncNumberInput
            value={category.threshold ?? 3}
            onChange={handleThresholdChange}
          />
        </SettingsGridField>
      )}
      <SettingsIdField
        id={category.id}
        name={category.singleName}
        warning="This will break the link with anything that references this ID."
        onChange={handleChangeId}
      />
      <SettingsGridField label="Delete">
        <Button css={{ width: "auto" }} onClick={handleClickDelete}>
          <i className="fas fa-trash" /> <Translate>Delete</Translate>
        </Button>
      </SettingsGridField>
    </InputGrid>
  );
};

CardCategorySettings.displayName = "CardCategorySettings";
