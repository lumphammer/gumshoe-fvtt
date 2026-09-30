import type React from "react";
import { useCallback, useEffect, useRef } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { Button } from "../inputs/Button";
import { SortableTable } from "../sortableTable";
import { Translate } from "../Translate";
import { SettingsEmptyState } from "./SettingsEmptyState";

type SettingsStringListProps = {
  value: string[];
  onChange: (value: string[]) => void;
  /** don't allow deleting the last item */
  nonempty?: boolean;
  /** allow drag-to-reorder. Turn this off where order doesn't mean anything */
  sortable?: boolean;
  addLabel?: string;
  /** shown instead of the list when it's empty */
  emptyMessage?: string;
  className?: string;
};

/**
 * An editable list of strings: each row is a text box and a delete button,
 * optionally with a drag handle for reordering.
 */
export const SettingsStringList = ({
  value,
  onChange,
  nonempty = false,
  sortable = true,
  addLabel = "Add item",
  emptyMessage = "Nothing here yet.",
  className,
}: SettingsStringListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // index of a row whose input should grab focus after the next render
  const focusIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (focusIndexRef.current === null) return;
    containerRef.current
      ?.querySelectorAll<HTMLInputElement>("input[data-index]")
      [focusIndexRef.current]?.focus();
    focusIndexRef.current = null;
  });

  const handleChangeItem = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(e.currentTarget.dataset["index"]);
      const newList = [...value];
      newList[index] = e.currentTarget.value;
      onChange(newList);
    },
    [onChange, value],
  );

  const handleDelete = useCallback(
    async (index: number) => {
      const item = value[index];
      // no need to ask about blank rows
      if (item.trim() !== "") {
        const aye = await confirmADoodleDo({
          message: "DeleteItemName",
          confirmText: "Delete",
          cancelText: "Cancel",
          confirmIconClass: "fa-trash",
          resolveFalseOnCancel: true,
          values: { Name: item },
        });
        if (!aye) return;
      }
      onChange(value.toSpliced(index, 1));
    },
    [onChange, value],
  );

  const handleAdd = useCallback(() => {
    focusIndexRef.current = value.length;
    onChange([...value, ""]);
  }, [onChange, value]);

  const handleReorder = useCallback(
    (newOrder: string[]) => {
      onChange(newOrder.map((i) => value[Number(i)]));
    },
    [onChange, value],
  );

  const renderRow = useCallback(
    (id: string) => {
      const index = Number(id);
      return (
        <div
          css={{
            gridColumn: "1/-1",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.5em",
          }}
        >
          <input
            css={{ flex: 1, minWidth: 0 }}
            type="text"
            data-index={index}
            value={value[index]}
            onChange={handleChangeItem}
          />
          <Button
            css={{ flex: "0 0 auto", width: "auto", margin: 0 }}
            onClick={() => void handleDelete(index)}
            disabled={nonempty && value.length < 2}
            title={value[index]}
            aria-label={`Delete ${value[index]}`}
          >
            <i className="fas fa-trash" />
          </Button>
        </div>
      );
    },
    [handleChangeItem, handleDelete, nonempty, value],
  );

  const ids = value.map((_, i) => i.toString());

  return (
    <div
      ref={containerRef}
      className={className}
      css={{ display: "flex", flexDirection: "column", gap: "0.5em" }}
    >
      {value.length === 0 ? (
        <SettingsEmptyState message={emptyMessage} />
      ) : sortable ? (
        <SortableTable
          css={{ position: "relative", padding: 0 }}
          items={ids}
          setItems={handleReorder}
          renderItem={renderRow}
          headers={[]}
        />
      ) : (
        <div css={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
          {ids.map((id) => (
            <div key={id}>{renderRow(id)}</div>
          ))}
        </div>
      )}
      <Button css={{ width: "100%", margin: 0 }} onClick={handleAdd}>
        <i className="fas fa-plus" /> <Translate>{addLabel}</Translate>
      </Button>
    </div>
  );
};

SettingsStringList.displayName = "SettingsStringList";
