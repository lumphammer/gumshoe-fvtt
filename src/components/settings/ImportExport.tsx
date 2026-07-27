import { useContext, useState } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { saveAsJsonFile } from "../../functions/saveFile";
import { getUserFile } from "../../functions/utilities";
import { getExportableSettingsDict } from "../../settings/getExportableSettingsDict";
import { validateImportedSettings } from "../../settings/validateImportedSettings";
import { Button } from "../inputs/Button";
import { TextInput } from "../inputs/TextInput";
import { Translate } from "../Translate";
import { DirtyContext, DispatchContext, StateContext } from "./contexts";
import { SettingsGridField } from "./SettingsGridField";
import { store } from "./store";

export const ImportExport = () => {
  let idx = 0;
  const dispatch = useContext(DispatchContext);
  const { settings: settingsState } = useContext(StateContext);
  const isDirty = useContext(DirtyContext);

  const [filename, setFilename] = useState<string>("settings");

  const handleExport = () => {
    const exportableSettings = getExportableSettingsDict(settingsState);
    saveAsJsonFile(exportableSettings, filename);
    ui.notifications?.info("Settings exported to file");
  };

  const handleImport = async () => {
    const aye =
      !isDirty() ||
      (await confirmADoodleDo({
        message:
          "You have unsaved changes. Are you sure you want to overwrite them?",
        confirmText: "Yes, discard my changes",
        cancelText: "Whoops, No!",
        confirmIconClass: "fas fa-times",
        resolveFalseOnCancel: true,
      }));
    if (!aye) {
      return;
    }

    const rawRext = await getUserFile("json");
    try {
      const newSettings = validateImportedSettings(rawRext);
      dispatch(store.creators.setSome({ newSettings }));
      ui.notifications?.info("Successfully imported settings");
    } catch (e: any) {
      ui.notifications?.error(`Error importing settings: ${e.message ?? e}`);
    }
  };

  return (
    <>
      <hr css={{ gridColumn: "label / end" }} />
      <h2 css={{ gridColumn: "label / end" }}>
        <Translate>Import/Export</Translate> (BETA - please report bugs!)
      </h2>
      <SettingsGridField label="Export settings to file" index={idx++}>
        <Translate>ItemName</Translate>
        <TextInput value={filename} onChange={setFilename} />
        <Button onClick={handleExport}>
          <Translate>Export</Translate>
        </Button>
      </SettingsGridField>
      {/* eslint-disable-next-line no-useless-assignment */}
      <SettingsGridField label="Import settings from file" index={idx++}>
        <Button onClick={handleImport}>
          <Translate>Import</Translate>
        </Button>
      </SettingsGridField>
    </>
  );
};

ImportExport.displayName = "ImportExport";
