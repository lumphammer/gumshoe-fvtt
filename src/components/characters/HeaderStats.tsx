import type { Stat } from "@lumphammer/investigator-fvtt-types";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useIsEditable } from "../../hooks/useIsEditable";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import { css, cx } from "../../styled-system/css";
import { badge } from "../../styled-system/recipes";
import { buttonKeys } from "../clickable";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";

/**
 * The stats shown with the name and personal details: those not placed on the
 * combat tab, and those too when there's no combat tab (Moribund World's
 * alternative item types, PCSheetFull).
 */
export const useHeaderStatIds = () =>
  useSettings((s) =>
    Object.keys(s.pcStats).filter(
      (id) =>
        s.mwUseAlternativeItemTypes || s.pcStats[id].placement !== "combat",
    ),
  );

const HeaderStatBadge = ({ id, stat }: { id: string; stat: Stat }) => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const isEditable = useIsEditable();
  const value =
    useActorSnapshot(
      actor,
      (snapshot): number | undefined => snapshot.system.stats[id],
    ) ?? stat.default;
  const [editing, setEditing] = useState(false);
  const badgeRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  // whether closing the editor should put focus back on the badge: yes when
  // closed from the keyboard, no when focus has moved somewhere else
  const refocus = useRef(false);

  // The editor comes and goes, so a save can still be on its way when it's
  // opened again, showing the old value. Undoing to that value would then
  // match the actor's data, and Foundry would drop it as no change: so every
  // save is sent, in order, without comparing. Only this stat is sent (the
  // field merges), so a save can't carry another badge's old value back.
  const onChange = useCallback(
    (newVal: number) =>
      actor.update({ system: { stats: { [id]: newVal } } }, { diff: false }),
    [actor, id],
  );

  // losing permission removes the editor without a blur: end the edit, so
  // getting it back doesn't bring back an unfocused editor
  if (editing && !isEditable) {
    setEditing(false);
  }

  useEffect(() => {
    if (editing) {
      const input = editorRef.current?.querySelector("input");
      input?.focus();
      input?.select();
    } else if (refocus.current) {
      refocus.current = false;
      badgeRef.current?.focus();
    }
  }, [editing]);

  const label = <span>{stat.name}</span>;

  if (editing && isEditable) {
    return (
      <div
        ref={editorRef}
        className={cx(
          badge(),
          css({
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5em",
            paddingBlock: "0",
          }),
        )}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setEditing(false);
          }
        }}
        onKeyDown={(event) => {
          if (
            (event.key === "Enter" || event.key === "Escape") &&
            // not while an input method is composing: its Enter commits it
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            event.stopPropagation();
            refocus.current = true;
            setEditing(false);
          }
        }}
      >
        {label}
        <AsyncNumberInput
          className={css({ width: "6em" })}
          min={stat.min ?? 0}
          max={stat.max}
          value={value}
          onChange={onChange}
          label={stat.name}
          smallButtons
        />
      </div>
    );
  }

  const content = (
    <>
      {label} <strong>{value}</strong>
    </>
  );

  const open = () => setEditing(true);

  if (!isEditable) {
    return <span className={badge()}>{content}</span>;
  }

  return (
    <a
      ref={badgeRef as React.RefObject<HTMLAnchorElement>}
      {...buttonKeys(open)}
      // on press, not click: pressing here closes another badge's editor,
      // which shifts the row, so the release can land somewhere else. The
      // press's own default (focusing what was pressed) comes after the
      // editor has opened and focused its input, and with the badge gone it
      // would focus nothing, blurring and closing the editor: so prevent it.
      onMouseDown={(event) => {
        if (event.button === 0) {
          event.preventDefault();
          open();
        }
      }}
      // and on a click alone, as screen readers and voice control send
      onClick={open}
      data-interactive
      className={badge()}
    >
      {content}
    </a>
  );
};

/**
 * A PC's stats as a line of badges, under the personal details. They're set
 * once and read now and then, unlike the pools in the sidebar, so each shows
 * its value, and becomes an input when clicked.
 */
export const HeaderStats = memo(function HeaderStats() {
  const ids = useHeaderStatIds();
  const stats = useSettings((s) => s.pcStats);
  if (ids.length === 0) {
    return null;
  }
  return (
    <div
      className={css({
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.25em 0.5em",
        marginTop: "0.5em",
      })}
    >
      {ids.map((id) => (
        <HeaderStatBadge key={id} id={id} stat={stats[id]} />
      ))}
    </div>
  );
});
