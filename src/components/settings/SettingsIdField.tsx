import { Button } from "../inputs/Button";
import { SettingsGridField } from "./SettingsGridField";
import { Translate } from "../Translate";

type SettingsIdFieldProps = {
  id: string;
  /** what the thing is called, for the prompt */
  name: string;
  /** what breaks if you change the id */
  warning: string;
  onChange: (newId: string) => void;
};

/**
 * Shows an id, with a button to change it. Ids are referenced from elsewhere,
 * so changing them is a deliberate act with a warning rather than a text box.
 */
export const SettingsIdField = ({
  id,
  name,
  warning,
  onChange,
}: SettingsIdFieldProps) => {
  const handleClickEdit = () => {
    const newId = prompt(
      `Change ID string for "${name}"\n\n⚠️ Careful! ${warning}`,
      id,
    );
    if (newId && newId !== id) {
      onChange(newId);
    }
  };

  return (
    <SettingsGridField label="Unique Id">
      <code>{id}</code>{" "}
      <Button css={{ width: "auto" }} onClick={handleClickEdit}>
        <Translate>Edit</Translate>
      </Button>
    </SettingsGridField>
  );
};

SettingsIdField.displayName = "SettingsIdField";
