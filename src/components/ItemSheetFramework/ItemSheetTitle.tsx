import { openSheet } from "../../functions/openSheet";
import { assertGame } from "../../functions/isGame";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useIsEditable } from "../../hooks/useIsEditable";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { css, cx } from "../../styled-system/css";
import { mutedText } from "../../styled-system/recipes";
import { clickable } from "../clickable";

/**
 * The top of an item's sheet: what type of item it is, who owns it (if
 * anyone, as a link to their sheet), and its name, which can be edited in
 * place. Reads the item and its owner through snapshots.
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
        // `minWidth: 0` lets the grid column shrink below a long unbroken
        // owner or item name, rather than the name widening the sheet
        css({
          display: "flex",
          flexDirection: "column",
          gap: "0.1em",
          minWidth: "0",
        }),
        className,
      )}
    >
      {typeLabel}
      {ownerName !== undefined && (
        <div
          className={cx(
            mutedText({ size: "sm" }),
            css({
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }),
          )}
          title={ownerName}
        >
          <a
            {...clickable(() => {
              openSheet(item.actor);
            })}
          >
            {ownerName}
          </a>
        </div>
      )}
      <h1
        className={css({
          "&&": { marginBottom: "0" },
          overflowWrap: "anywhere",
        })}
      >
        <span
          contentEditable={isEditable}
          className={css({
            minWidth: "1em",
            maxWidth: "100%",
            display: "inline-block",
          })}
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
