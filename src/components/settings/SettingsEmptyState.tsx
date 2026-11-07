import { Translate } from "../Translate";
import { emptyState } from "../../styled-system/recipes";

/**
 * Stands in for a list with nothing in it (the catalogue's `emptyState`).
 */
export const SettingsEmptyState = ({ message }: { message: string }) => {
  return (
    <div className={emptyState()}>
      <Translate>{message}</Translate>
    </div>
  );
};

SettingsEmptyState.displayName = "SettingsEmptyState";
