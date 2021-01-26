/** @jsx jsx */
import { jsx } from "@emotion/react";
import React from "react";
import { useAsyncUpdate } from "../hooks/useAsyncUpdate";
import { TrailActor } from "../module/TrailActor";
import { TextArea } from "./inputs/TextArea";

type NotesAreaProps = {
  actor: TrailActor,
};

export const NotesArea: React.FC<NotesAreaProps> = ({
  actor,
}) => {
  const notes = useAsyncUpdate(actor.getter("notes")(), actor.setter("notes"));
  const occupationalBenefits = useAsyncUpdate(
    actor.getter("occupationalBenefits")(),
    actor.setter("occupationalBenefits"));
  const pillarsOfSanity = useAsyncUpdate(
    actor.getter("pillarsOfSanity")(),
    actor.setter("pillarsOfSanity"));
  const sourcesOfStability = useAsyncUpdate(
    actor.getter("sourcesOfStability")(),
    actor.setter("sourcesOfStability"));
  const background = useAsyncUpdate(
    actor.getter("background")(),
    actor.setter("background"));

  return (
    <div
      css={{
        paddingTop: "1em",
      }}
    >
      <h2>Notes, contacts etc.</h2>
      <TextArea
        onChange={notes.onChange}
        onBlur={notes.onBlur}
        onFocus={notes.onFocus}
        value={notes.display}
      />
      <h2>Occupational Bennies</h2>
      <TextArea
        onChange={occupationalBenefits.onChange}
        onBlur={occupationalBenefits.onBlur}
        onFocus={occupationalBenefits.onFocus}
        value={occupationalBenefits.display}
      />
      <h2>Pillars of Sanity</h2>
      <TextArea
        onChange={pillarsOfSanity.onChange}
        onBlur={pillarsOfSanity.onBlur}
        onFocus={pillarsOfSanity.onFocus}
        value={pillarsOfSanity.display}
      />
      <h2>Sources of Stability</h2>
      <TextArea
        onChange={sourcesOfStability.onChange}
        onBlur={sourcesOfStability.onBlur}
        onFocus={sourcesOfStability.onFocus}
        value={sourcesOfStability.display}
      />
      <h2>Background</h2>
      <TextArea
        onChange={background.onChange}
        onBlur={background.onBlur}
        onFocus={background.onFocus}
        value={background.display}
      />
    </div>
  );
};
