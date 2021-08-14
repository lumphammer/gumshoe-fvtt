/** @jsx jsx */
import { jsx } from "@emotion/react";
import React, { Fragment, useCallback } from "react";
import { GumshoeActor } from "../../module/GumshoeActor";
import { AsyncTextArea } from "../inputs/AsyncTextArea";
import { getLongNotes } from "../../settingsHelpers";
import { assertPCDataSource } from "../../types";

type NotesAreaProps = {
  actor: GumshoeActor,
};

export const NotesArea: React.FC<NotesAreaProps> = ({
  actor,
}) => {
  const longNotesNames = getLongNotes();

  const updateLongNote = useCallback((value, index) => {
    actor.setLongNote(index, value);
  }, [actor]);

  return (
    <div
      css={{
        paddingTop: "1em",
      }}
    >
      {
        longNotesNames.map<JSX.Element>((name: string, i: number) => {
          assertPCDataSource(actor.data);
          return (
            <Fragment key={`${name}--${i}`}>
              <h2>{name}</h2>
              <AsyncTextArea
                onChange={updateLongNote}
                value={actor.data.data.longNotes[i]}
                index={i}
              />
            </Fragment>
          );
        })
      }
    </div>
  );
};
