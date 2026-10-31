import React, { memo, useCallback, useContext } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import { getDevMode } from "../../functions/utilities";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertPCActor } from "../../module/actors/pc";
import { runtimeConfig } from "../../runtime";
import { ThemeContext } from "../../themes/ThemeContext";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";

const defaultThemeIdentifier = "PQkMK35MWjRI2";
/** The PC's own settings, read through a snapshot */
export const SettingArea = memo(function SettingArea() {
  const { actor } = useActorSheetContext();
  assertGame(game);
  assertPCActor(actor);
  const pc = useActorSnapshot(actor, (snapshot) => {
    const system = snapshot?.system as
      | {
          sheetTheme: string | null;
          initiativePassingTurns: number;
          isHuman: boolean;
          immuneToLethality: boolean;
        }
      | undefined;
    return {
      sheetTheme: system?.sheetTheme ?? null,
      initiativePassingTurns: system?.initiativePassingTurns ?? 0,
      isHuman: system?.isHuman ?? false,
      immuneToLethality: system?.immuneToLethality ?? false,
    };
  });
  const s = useSettings((s) => ({
    useTurnPassing: s.useTurnPassingInitiative,
    showIsHuman: s.useDamageApplication && s.useGunfireOnHumans,
    showImmuneToLethality: s.useDamageApplication && s.useLethalityAndAutofire,
    defaultThemeName: s.defaultThemeName,
  }));
  const methods = useSystemMethods(actor);
  const { setSheetTheme } = methods;
  const onSetTheme = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.currentTarget.value;
      const themeName = value === defaultThemeIdentifier ? null : value;
      void setSheetTheme(themeName);
    },
    [setSheetTheme],
  );
  const theme = useContext(ThemeContext);
  const isDevMode = getDevMode();
  const defaultThemeDisplayName =
    runtimeConfig.themes[s.defaultThemeName]?.displayName;
  return (
    <>
      <InputGrid>
        <GridField label="Theme">
          <Select
            onChange={onSetTheme}
            value={pc.sheetTheme || defaultThemeIdentifier}
          >
            {Object.keys(runtimeConfig.themes).map((themeName) => (
              <option key={themeName} value={themeName}>
                {runtimeConfig.themes[themeName].displayName}
              </option>
            ))}
            <option value={defaultThemeIdentifier}>
              {getTranslated("Default")} ({defaultThemeDisplayName})
            </option>
          </Select>
        </GridField>

        {s.useTurnPassing && (
          <GridField label="Number of turns">
            <AsyncNumberInput
              value={pc.initiativePassingTurns}
              onChange={methods.setPassingTurns}
            />
          </GridField>
        )}

        {s.showIsHuman && (
          <GridField label="Human?">
            <Toggle
              label={getTranslated("Human?")}
              checked={pc.isHuman}
              onChange={methods.setIsHuman}
            />
          </GridField>
        )}

        {s.showImmuneToLethality && (
          <GridField label="Immune to Lethality?">
            <Toggle
              label={getTranslated("Immune to Lethality?")}
              checked={pc.immuneToLethality}
              onChange={methods.setImmuneToLethality}
            />
          </GridField>
        )}

        {isDevMode && (
          <GridField label="Nuke">
            <Button onClick={methods.confirmNuke}>
              <Translate>Nuke</Translate>
            </Button>
          </GridField>
        )}
      </InputGrid>

      <p
        css={{
          textTransform: "initial",
          border: "1px dashed currentColor",
          padding: "1em",
          margin: "2em 1em 1em 1em",
          backgroundColor: theme.colors.backgroundSecondary,
        }}
      >
        <a target="_new" href="https://github.com/n3dst4/investigator-fvtt">
          GUMSHOE for FoundryVTT (aka INVESTIGATOR)
        </a>{" "}
        is made by me, Neil de Carteret. Find all my non-work links and ways to
        contact me at my{" "}
        <a target="_new" href="https://lumphammer.net">
          Lumphammer Projects
        </a>{" "}
        site.
      </p>
    </>
  );
});
