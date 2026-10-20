import { useId } from "react";

import { IdContext } from "../IdContext";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";

type EditModeToggleProps = {
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
};

/** The switch between playing with a sheet's abilities and editing them */
export const EditModeToggle = ({
  editMode,
  setEditMode,
}: EditModeToggleProps) => {
  const id = useId();
  return (
    <div
      css={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "0.5em",
        marginBottom: "0.5em",
      }}
    >
      <label htmlFor={id}>
        <Translate>Edit mode</Translate>
      </label>
      <IdContext.Provider value={id}>
        <Toggle checked={editMode} onChange={setEditMode} />
      </IdContext.Provider>
    </div>
  );
};
