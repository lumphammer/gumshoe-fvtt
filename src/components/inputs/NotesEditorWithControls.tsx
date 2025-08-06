import React, { useCallback, useEffect, useState } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import { convertNotes, toHtml } from "../../functions/textFunctions";
import { getDevMode, systemLogger } from "../../functions/utilities";
import { useIsDocumentOwner } from "../../hooks/useIsDocumentOwner";
import { useStateWithGetter } from "../../hooks/useStateWithGetter";
import { NoteFormat, NoteWithFormat } from "../../types";
import { Translate } from "../Translate";
import { ToolbarButton } from "./Button";
import { NotesEditor } from "./NotesEditor";

export interface NotesEditorWithControlsProps {
  source: string;
  html: string;
  format: NoteFormat;
  className?: string;
  onSave: (note: NoteWithFormat) => void;
  allowChangeFormat: boolean;
  title?: string;
}

export const NotesEditorWithControls = ({
  source: origSource,
  html: origHtml,
  format: origFormat,
  onSave,
  className,
  allowChangeFormat,
  title,
}: NotesEditorWithControlsProps) => {
  assertGame(game);
  const [editMode, setEditMode] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const [getLiveSource, setLiveSource, liveSource] =
    useStateWithGetter(origSource);
  const [getLiveHtml, setLiveHtml, liveHtml] = useStateWithGetter(origHtml);
  const [getLiveFormat, setLiveFormat, liveFormat] =
    useStateWithGetter(origFormat);

  // update live state from props when we're not in edit mode
  // need this to see live updates to notes from other sources
  useEffect(() => {
    if (!editMode) {
      setLiveSource(origSource);
      setLiveHtml(origHtml);
      setLiveFormat(origFormat);
    }
  }, [
    origSource,
    origHtml,
    origFormat,
    setLiveSource,
    setLiveHtml,
    setLiveFormat,
    editMode,
  ]);

  const [dirty, setDirty] = useState(false);
  const isDebugging = getDevMode();

  const handleSetSource = useCallback(
    async (newSource: string) => {
      setLiveSource(newSource);
      const newHtml = await toHtml(liveFormat, newSource);
      setLiveHtml(newHtml);
      setDirty(true);
    },
    [liveFormat, setLiveHtml, setLiveSource],
  );

  const handleClickEdit = useCallback(() => {
    setLiveSource(origSource);
    setEditMode(true);
    setDirty(false);
  }, [origSource, setLiveSource]);

  const handleSave = useCallback(() => {
    const result = {
      format: getLiveFormat(),
      html: getLiveHtml(),
      source: getLiveSource(),
    };
    systemLogger.log("Saving", result);
    onSave(result);
    setEditMode(false);
    setDirty(false);
  }, [getLiveFormat, getLiveHtml, getLiveSource, onSave]);

  const handleClickCancel = useCallback(async () => {
    if (dirty) {
      await confirmADoodleDo({
        message: "Lose unsaved changes?",
        confirmText: "Confirm",
        cancelText: "Whoops, no!",
        confirmIconClass: "fa-ban",
      });
    }
    setLiveSource(origSource);
    setEditMode(false);
    setDirty(false);
  }, [dirty, origSource, setLiveSource]);

  const handleChangeFormat = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newFormat = e.currentTarget.value as NoteFormat;
      const { newHtml, newSource } = await convertNotes(
        liveFormat,
        newFormat,
        liveSource,
      );
      setLiveFormat(newFormat);
      setLiveSource(newSource);
      setLiveHtml(newHtml);
      setDirty(true);
    },
    [liveFormat, liveSource, setLiveFormat, setLiveHtml, setLiveSource],
  );

  const isOwner = useIsDocumentOwner();

  return (
    <div
      className={`notes-editor-with-controls ${className}`}
      css={{
        gridColumn: "label / end",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "0.3em",
      }}
    >
      <div
        css={{
          display: "flex",
          flexDirection: "row",
          gap: "0.5em",
          alignItems: "end",
        }}
      >
        <h3
          css={{
            flex: 1,
            marginTop: 0,
            marginBottom: 0,
          }}
        >
          {title === undefined ? <Translate>Notes</Translate> : title}
        </h3>

        {isDebugging && (
          <ToolbarButton onClick={() => setShowSource((e) => !e)}>
            <i className={showSource ? "fas fa-window-close" : "fas fa-code"} />
          </ToolbarButton>
        )}

        {!editMode && !showSource && isOwner && (
          <ToolbarButton onClick={handleClickEdit}>
            <i className="fas fa-edit" />
            <Translate>Edit</Translate>
          </ToolbarButton>
        )}

        {editMode && !showSource && (
          <>
            <ToolbarButton onClick={handleSave}>
              <i className="fas fa-download" />
              <Translate>Save</Translate>
            </ToolbarButton>
            <ToolbarButton onClick={handleClickCancel}>
              <i className="fas fa-ban" />
              <Translate>Cancel</Translate>
            </ToolbarButton>
          </>
        )}

        {allowChangeFormat && editMode && !showSource && (
          <select
            value={liveFormat}
            onChange={handleChangeFormat}
            css={{ height: "auto" }}
          >
            <option value="plain">{getTranslated("Plain")}</option>
            <option value="markdown">{getTranslated("Markdown")}</option>
            <option value="richText">{getTranslated("RichText")}</option>
          </select>
        )}
        {/* </div> */}
      </div>
      <div
        css={{
          flex: 1,
          position: "relative",
        }}
      >
        <NotesEditor
          source={liveSource}
          html={liveHtml}
          format={liveFormat}
          // className={className}
          editMode={editMode}
          showSource={showSource}
          onSetSource={handleSetSource}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};
