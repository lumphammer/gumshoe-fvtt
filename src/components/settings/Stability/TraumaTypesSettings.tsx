import { useNavigationContext } from "@lumphammer/minirouter";
import { nanoid } from "nanoid";
import { useContext } from "react";

import { getTranslated } from "../../../functions/getTranslated";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { ModifyContext, StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import { SettingsSortableList } from "../SettingsSortableList";
import type { Setters } from "../types";
import { traumaType } from "./directions";

export const TraumaTypesSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);
  const modify = useContext(ModifyContext);
  const { navigate } = useNavigationContext();
  const types = settings.traumaTypes;

  const handleAdd = () => {
    // new types go on the end
    const index = types.length;
    modify((s) => {
      s.traumaTypes.push({
        id: nanoid(),
        name: getTranslated("New trauma type"),
        difficulty: 4,
        adaptedDifficulty: 2,
        causesSanityLoss: false,
        useAdaptation: false,
        cappedAbilities: [],
        capsBonds: false,
        refreshPenalty: 0,
      });
    });
    navigate("here", traumaType(index));
  };

  const handleReorder = (newOrder: number[]) => {
    modify((s) => {
      s.traumaTypes = newOrder.map((i) => types[i]);
    });
  };

  return (
    <div
      data-testid="trauma-types-settings"
      css={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <InputGrid>
        <SettingsGridField label="Use trauma?">
          <Toggle checked={settings.useTrauma} onChange={setters.useTrauma} />
        </SettingsGridField>
      </InputGrid>
      {settings.useTrauma && (
        <>
          <h3>
            <Translate>Trauma types</Translate>
          </h3>
          <SettingsSortableList
            css={{ flex: 1, minHeight: "10em" }}
            rows={types.map((type) => ({
              name: type.name,
              detail: (
                <Translate values={{ Difficulty: String(type.difficulty) }}>
                  DifficultyN
                </Translate>
              ),
            }))}
            linkTo={traumaType}
            onReorder={handleReorder}
            onAdd={handleAdd}
            addLabel="Add trauma type"
            emptyMessage="No trauma types yet."
          />
        </>
      )}
    </div>
  );
};

TraumaTypesSettings.displayName = "TraumaTypesSettings";
