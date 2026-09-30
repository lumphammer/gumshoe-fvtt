import { useState } from "react";

import { settings as systemSettings } from "../../../settings/settings";
import { retryFailedMigrations } from "../../../startup/migrateWorldIfNeeded";
import { Button } from "../../inputs/Button";
import { InputGrid } from "../../inputs/InputGrid";
import { SettingsGridField } from "../SettingsGridField";

export const MigrationRecoverySettings = () => {
  const [isRetryingMigrations, setIsRetryingMigrations] = useState(false);
  // read live rather than from the form state: migrations can run while this
  // dialog is open, and these settings aren't managed by the form anyway.
  const [lastMigrationError, setLastMigrationError] = useState(() =>
    systemSettings.migrationLastError.get(),
  );

  const retryMigrations = async () => {
    setIsRetryingMigrations(true);
    try {
      await retryFailedMigrations();
    } finally {
      setLastMigrationError(systemSettings.migrationLastError.get());
      setIsRetryingMigrations(false);
    }
  };

  return (
    <InputGrid>
      <SettingsGridField label="Last migration error">
        <div css={{ fontFamily: "monospace" }}>{lastMigrationError}</div>
      </SettingsGridField>
      <SettingsGridField label="Retry migration">
        <Button disabled={isRetryingMigrations} onClick={retryMigrations}>
          {isRetryingMigrations ? "Retrying…" : "Retry now"}
        </Button>
      </SettingsGridField>
    </InputGrid>
  );
};

MigrationRecoverySettings.displayName = "MigrationRecoverySettings";
