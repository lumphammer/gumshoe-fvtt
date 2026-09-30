import type { PersonalDetailType } from "@lumphammer/investigator-fvtt-types";
import { useNavigationContext, useParams } from "@lumphammer/minirouter";
import type React from "react";
import { useCallback, useContext } from "react";

import { confirmADoodleDo } from "../../../functions/confirmADoodleDo";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { SettingsGridField } from "../SettingsGridField";
import { InputGrid } from "../../inputs/InputGrid";
import { Translate } from "../../Translate";
import { ModifyContext } from "../contexts";
import { useStateSelector } from "../hooks";
import { personalDetail } from "./directions";

export const PersonalDetailSettings = () => {
  const index = useParams(personalDetail);
  const { navigate } = useNavigationContext();
  const modify = useContext(ModifyContext);
  const { value: detail, freeze } = useStateSelector(
    (s) => s.settings.personalDetails[index],
  );

  const handleNameChange = useCallback(
    (name: string) => {
      modify((s) => {
        s.personalDetails[index].name = name;
      });
    },
    [index, modify],
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const type = e.currentTarget.value as PersonalDetailType;
      modify((s) => {
        s.personalDetails[index].type = type;
      });
    },
    [index, modify],
  );

  const handleClickDelete = useCallback(async () => {
    const aye = await confirmADoodleDo({
      message: "DeletePersonalDetailName",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: { Name: detail?.name ?? "" },
    });
    if (aye) {
      // keep showing this detail while the panel animates out, rather than
      // whatever slides into its index
      freeze();
      navigate("here", "up");
      modify((s) => {
        s.personalDetails.splice(index, 1);
      });
    }
  }, [detail?.name, freeze, index, modify, navigate]);

  return (
    <InputGrid>
      <SettingsGridField label="Name">
        <AsyncTextInput value={detail?.name} onChange={handleNameChange} />
      </SettingsGridField>
      <SettingsGridField label="Type">
        <select value={detail?.type ?? "text"} onChange={handleTypeChange}>
          <option value="text">
            <Translate>Text</Translate>
          </option>
          <option value="item">
            <Translate>Item</Translate>
          </option>
        </select>
      </SettingsGridField>
      <SettingsGridField label="Delete">
        <Button css={{ width: "auto" }} onClick={handleClickDelete}>
          <i className="fas fa-trash" /> <Translate>Delete</Translate>
        </Button>
      </SettingsGridField>
    </InputGrid>
  );
};

PersonalDetailSettings.displayName = "PersonalDetailSettings";
