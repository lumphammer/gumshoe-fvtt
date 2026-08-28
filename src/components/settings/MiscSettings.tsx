import { useContext, useState } from "react";

import { getDevMode } from "../../functions/utilities";
import { settings as systemSettings } from "../../settings/settings";
import { retryFailedMigrations } from "../../startup/migrateWorldIfNeeded";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { Button } from "../inputs/Button";
import { InputGrid } from "../inputs/InputGrid";
import { ListEdit } from "../inputs/ListEdit";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { StateContext } from "./contexts";
import { ImportExport } from "./ImportExport";
import { SettingsGridField } from "./SettingsGridField";
import { Setters } from "./types";

export const MiscSettings = ({ setters }: { setters: Setters }) => {
  const isDevMode = getDevMode();

  let idx = 0;

  const { settings } = useContext(StateContext);
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
    <InputGrid
      css={{
        flex: 1,
        overflow: "auto",
      }}
    >
      <SettingsGridField label="Custom themes path" index={idx++}>
        <AsyncTextInput
          onChange={setters.customThemePath}
          value={settings.customThemePath}
        />
      </SettingsGridField>
      <SettingsGridField label="Use turn-passing initiative?" index={idx++}>
        <Toggle
          checked={settings.useTurnPassingInitiative}
          onChange={setters.useTurnPassingInitiative}
        />
      </SettingsGridField>

      {isDevMode && (
        <SettingsGridField label="Debug translations?" index={idx++}>
          <Toggle
            checked={settings.debugTranslations}
            onChange={setters.debugTranslations}
          />
        </SettingsGridField>
      )}

      {/* ####################################################################
          MORIBUND WORLD STUFF BELOW HERE
        #################################################################### */}

      <hr css={{ gridColumn: "label / end" }} />
      <h2 css={{ gridColumn: "label / end" }}>
        <Translate>Settings for Moribund World users</Translate>
      </h2>
      <SettingsGridField
        label="Use Moribund World-style abilities"
        index={idx++}
      >
        <Toggle
          checked={settings.useMwStyleAbilities}
          onChange={setters.useMwStyleAbilities}
        />
      </SettingsGridField>
      <SettingsGridField label="Use alternative item types" index={idx++}>
        <Toggle
          checked={settings.mwUseAlternativeItemTypes}
          onChange={setters.mwUseAlternativeItemTypes}
        />
      </SettingsGridField>
      <SettingsGridField label="Hidden Short Notes Fields" index={idx++}>
        <ListEdit
          value={settings.mwHiddenShortNotes}
          onChange={setters.mwHiddenShortNotes}
        />
      </SettingsGridField>
      <SettingsGridField label="Use injury status" index={idx++}>
        <Toggle
          checked={settings.useMwInjuryStatus}
          onChange={setters.useMwInjuryStatus}
        />
      </SettingsGridField>

      {/* ####################################################################
          IMPORT / EXPORT
        #################################################################### */}

      <ImportExport />

      {/* ####################################################################
          MIGRATION RECOVERY
        #################################################################### */}

      {lastMigrationError !== "" && (
        <>
          <hr css={{ gridColumn: "label / end" }} />
          <h2 css={{ gridColumn: "label / end" }}>
            <Translate>Migration recovery</Translate>
          </h2>
          <SettingsGridField label="Last migration error" index={idx++}>
            <div css={{ fontFamily: "monospace" }}>{lastMigrationError}</div>
          </SettingsGridField>
          <SettingsGridField label="Retry migration" index={idx}>
            <Button disabled={isRetryingMigrations} onClick={retryMigrations}>
              {isRetryingMigrations ? "Retrying…" : "Retry now"}
            </Button>
          </SettingsGridField>
        </>
      )}
    </InputGrid>
  );
};

MiscSettings.displayName = "MiscSettings";
