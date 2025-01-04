import React, { Fragment, useCallback, useContext } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { assertGame, getDevMode } from "../../functions/utilities";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { runtimeConfig } from "../../runtime";
import { settings } from "../../settings/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { NoteFormat } from "../../types";
import { assertPCActor } from "../../v10Types";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";

const settingsUseTurnPassing = settings.useTurnPassingInitiative.get;

export const SettingArea = () => {
  const { actor } = useActorSheetContext();
  assertGame(game);
  assertPCActor(actor);
  const onSetTheme = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.currentTarget.value;
      const themeName = value === "default" ? null : value;
      void actor.setSheetTheme(themeName);
    },
    [actor],
  );
  const theme = useContext(ThemeContext);
  const isDevMode = getDevMode();

  return (
    <Fragment>
      <InputGrid>
        <GridField label="Theme">
          <select
            onChange={onSetTheme}
            value={actor.getSheetThemeName() || "default"}
          >
            {Object.keys(runtimeConfig.themes).map((themeName) => (
              <option key={themeName} value={themeName}>
                {runtimeConfig.themes[themeName].displayName}
              </option>
            ))}
            <option value="default">{getTranslated("UseSystemDefault")}</option>
          </select>
        </GridField>

        <GridField label="Notes Format">
          <select
            value={actor.system.longNotesFormat}
            onChange={(e) => {
              void actor.setLongNotesFormat(
                e.currentTarget.value as NoteFormat,
              );
            }}
          >
            <option value={NoteFormat.plain}>{getTranslated("Plain")}</option>
            <option value={NoteFormat.markdown}>
              {getTranslated("Markdown")}
            </option>
            <option value={NoteFormat.richText}>
              {getTranslated("RichText")}
            </option>
          </select>
        </GridField>

        {settingsUseTurnPassing() && (
          <GridField label="Number of turns">
            <AsyncNumberInput
              value={actor.system.initiativePassingTurns}
              onChange={actor.setPassingTurns}
            />
          </GridField>
        )}

        {isDevMode && (
          <GridField label="Nuke">
            <Button onClick={actor.confirmNuke}>
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
    </Fragment>
  );
};
