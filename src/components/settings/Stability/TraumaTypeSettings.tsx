import type { TraumaType } from "@lumphammer/investigator-fvtt-types";
import { useNavigationContext, useParams } from "@lumphammer/minirouter";
import { useContext } from "react";

import { confirmADoodleDo } from "../../../functions/confirmADoodleDo";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { ModifyContext, StateContext } from "../contexts";
import { useStateSelector } from "../hooks";
import { SettingsGridField } from "../SettingsGridField";
import { SettingsIdField } from "../SettingsIdField";
import { SettingsNote } from "../SettingsNote";
import { SettingsStringList } from "../SettingsStringList";
import { traumaType } from "./directions";
import { NamedTranslate } from "./NamedTranslate";

/** One trauma type: how hard it is, what it costs, and adapting to it */
export const TraumaTypeSettings = () => {
  const index = useParams(traumaType);
  const { settings } = useContext(StateContext);
  const modify = useContext(ModifyContext);
  const { navigate } = useNavigationContext();
  const { value: type, freeze } = useStateSelector(
    (s) => s.settings.traumaTypes[index],
  );

  const set =
    <K extends keyof TraumaType>(key: K) =>
    (value: TraumaType[K]) => {
      modify((s) => {
        s.traumaTypes[index][key] = value;
      });
    };

  const handleChangeId = (newId: string) => {
    // ids must be unique: actors' adaptation progress is keyed by them
    if (settings.traumaTypes.some(({ id }) => id === newId)) {
      ui.notifications?.warn(`ID string already in use: "${newId}"`);
      return;
    }
    modify((s) => {
      s.traumaTypes[index].id = newId;
    });
  };

  const handleClickDelete = async () => {
    if (type === undefined) return;
    const aye = await confirmADoodleDo({
      message: "DeleteTraumaTypeName",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: { Name: type.name || type.id },
    });
    if (aye) {
      // keep showing this type while the panel animates out, rather than
      // whatever slides into its index
      freeze();
      navigate("here", "up");
      modify((s) => {
        s.traumaTypes = s.traumaTypes.filter(({ id }) => id !== type.id);
      });
    }
  };

  if (type === undefined) {
    return null;
  }

  return (
    <div data-testid="trauma-type-settings">
      <InputGrid>
        <SettingsGridField label="Name">
          <AsyncTextInput value={type.name} onChange={set("name")} />
        </SettingsGridField>
        <SettingsGridField label="Difficulty">
          <AsyncNumberInput
            min={0}
            value={type.difficulty}
            onChange={set("difficulty")}
          />
        </SettingsGridField>
        {settings.useSanityRules && (
          <SettingsGridField
            label={<NamedTranslate>TraumaCausesSanityLosses</NamedTranslate>}
          >
            <Toggle
              checked={type.causesSanityLoss}
              onChange={set("causesSanityLoss")}
            />
          </SettingsGridField>
        )}
        <SettingsGridField label="Use adaptation?">
          <Toggle
            checked={type.useAdaptation}
            onChange={set("useAdaptation")}
          />
        </SettingsGridField>
        {type.useAdaptation && (
          <>
            <SettingsGridField label="Difficulty when adapted">
              <AsyncNumberInput
                min={0}
                value={type.adaptedDifficulty}
                onChange={set("adaptedDifficulty")}
              />
            </SettingsGridField>
            <SettingsGridField label="Caps Bonds?">
              <Toggle checked={type.capsBonds} onChange={set("capsBonds")} />
            </SettingsGridField>
            <SettingsGridField label="Refresh penalty">
              <AsyncNumberInput
                min={0}
                value={type.refreshPenalty}
                onChange={set("refreshPenalty")}
              />
            </SettingsGridField>
          </>
        )}
        <SettingsIdField
          id={type.id}
          name={type.name}
          warning="Characters' progress towards adapting to it is kept under its ID, so they will lose it."
          onChange={handleChangeId}
        />
        <SettingsGridField label="Delete">
          <Button css={{ width: "auto" }} onClick={handleClickDelete}>
            <i className="fas fa-trash" /> <Translate>Delete</Translate>
          </Button>
        </SettingsGridField>
      </InputGrid>
      {type.useAdaptation && (
        <>
          <h3>
            <Translate>Abilities capped by adaptation</Translate>
          </h3>
          <SettingsNote>
            <Translate>AdaptationCappedAbilitiesNote</Translate>
          </SettingsNote>
          <SettingsStringList
            value={type.cappedAbilities}
            onChange={set("cappedAbilities")}
            sortable={false}
            addLabel="Add ability"
            emptyMessage="No abilities yet."
          />
        </>
      )}
    </div>
  );
};

TraumaTypeSettings.displayName = "TraumaTypeSettings";
