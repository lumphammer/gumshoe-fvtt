import { type ReactNode, useId } from "react";

import { IdContext } from "../IdContext";
import { Panel } from "../Panel";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { css } from "../../styled-system/css";

type EditModeToggleProps = {
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
  /** Anything else for the strip, on its left */
  children?: ReactNode;
};

/**
 * The switch between playing with a sheet's abilities and editing them, at the
 * right of a strip which can hold other things on its left
 */
export const EditModeToggle = ({
  editMode,
  setEditMode,
  children,
}: EditModeToggleProps) => {
  const id = useId();
  return (
    <Panel
      className={css({
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "0.5em",
        marginBottom: "0.5em",
      })}
    >
      {children}
      <label htmlFor={id} className={css({ marginLeft: "auto" })}>
        <Translate>Edit mode</Translate>
      </label>
      <IdContext.Provider value={id}>
        {/* observers can look at edit mode too, with its inputs disabled */}
        <Toggle checked={editMode} onChange={setEditMode} alwaysEnabled />
      </IdContext.Provider>
    </Panel>
  );
};
