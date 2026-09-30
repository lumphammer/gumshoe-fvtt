import { useNavigationContext } from "@lumphammer/minirouter";
import { useCallback, useContext } from "react";

import { Translate } from "../../Translate";
import { ModifyContext, StateContext } from "../contexts";
import { SettingsNote } from "../SettingsNote";
import { SettingsSortableList } from "../SettingsSortableList";
import type { Setters } from "../types";
import { personalDetail } from "./directions";

export const PersonalDetailsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);
  const modify = useContext(ModifyContext);
  const { navigate } = useNavigationContext();

  const handleAdd = useCallback(() => {
    const index = settings.personalDetails.length;
    modify((s) => {
      s.personalDetails.push({ name: "", type: "text" });
    });
    navigate("here", personalDetail(index));
  }, [modify, navigate, settings.personalDetails.length]);

  const handleReorder = useCallback(
    (newOrder: number[]) => {
      setters.personalDetails(newOrder.map((i) => settings.personalDetails[i]));
    },
    [setters, settings.personalDetails],
  );

  return (
    <div css={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <SettingsNote>
        <Translate>PositionalFieldsNote</Translate>
      </SettingsNote>
      <SettingsSortableList
        css={{ flex: 1 }}
        rows={settings.personalDetails.map(({ name, type }) => ({
          name,
          detail: <Translate>{type === "item" ? "Item" : "Text"}</Translate>,
        }))}
        linkTo={personalDetail}
        onReorder={handleReorder}
        onAdd={handleAdd}
        addLabel="Add personal detail"
        detailHeader="Type"
      />
    </div>
  );
};

PersonalDetailsSettings.displayName = "PersonalDetailsSettings";
