import { assertGame } from "../../functions/isGame";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useIsEditable } from "../../hooks/useIsEditable";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { css, cx } from "../../styled-system/css";
import { mutedText } from "../../styled-system/recipes";

/**
 * The top of an item's sheet: what type of item it is, who owns it (if
 * anyone), and its name, which can be edited in place. Reads the item and its
 * owner through snapshots.
 */
export const ItemSheetTitle = ({ className }: { className?: string }) => {
  const { item } = useItemSheetContext();
  const name = useItemSelector(item, (snapshot) => snapshot.name);
  const ownerName = useActorSnapshot(item.actor, (actor) => actor?.name);
  const isEditable = useIsEditable();
  const { contentEditableRef, onBlur, onFocus, onInput, onKeyDown, onPaste } =
    useAsyncUpdate(name, item.setName);

  assertGame(game);
  // Foundry's own name for the type (not `CONFIG.Item.typeLabels`, which
  // loses Moribund World items' when they're switched off)
  const typeLabel = game.i18n.localize(`TYPES.Item.${item.type}`);

  return (
    <div
      className={cx(
        css({ display: "flex", flexDirection: "column", gap: "0.1em" }),
        className,
      )}
    >
      {typeLabel}
      {ownerName !== undefined && (
        <div className={mutedText({ size: "sm" })}>{ownerName}</div>
      )}
      <h1 className={css({ "&&": { marginBottom: "0" } })}>
        <span
          contentEditable={isEditable}
          className={css({ minWidth: "1em", display: "inline-block" })}
          ref={contentEditableRef}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      </h1>
    </div>
  );
};
