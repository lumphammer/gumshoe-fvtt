import { type AnyStep, Link } from "@lumphammer/minirouter";
import type { ReactNode } from "react";
import { useCallback } from "react";

import { Button } from "../inputs/Button";
import { SortableTable } from "../sortableTable";
import { Translate } from "../Translate";
import { SettingsEmptyState } from "./SettingsEmptyState";
import { useListHoverBg } from "./useListHoverBg";

type SettingsSortableListProps = {
  rows: { name: string; detail?: ReactNode }[];
  /** where each row links to, by index */
  linkTo: (index: number) => AnyStep;
  /** called with the old indices, in their new order */
  onReorder: (newOrder: number[]) => void;
  onAdd: () => void;
  addLabel: string;
  nameHeader?: string;
  detailHeader?: string;
  /** shown instead of the list when it's empty */
  emptyMessage?: string;
  className?: string;
};

/**
 * A drag-to-reorder, click-to-edit list of things in settings. Items are
 * identified by position, so this should only be used where the list can't
 * change underneath it (i.e. while an item is open for editing, it covers the
 * list.)
 */
export const SettingsSortableList = ({
  rows,
  linkTo,
  onReorder,
  onAdd,
  addLabel,
  nameHeader = "Name",
  detailHeader = "",
  emptyMessage = "Nothing here yet.",
  className,
}: SettingsSortableListProps) => {
  const hoverBg = useListHoverBg();

  const handleSetItems = useCallback(
    (newOrder: string[]) => {
      onReorder(newOrder.map(Number));
    },
    [onReorder],
  );

  const renderRow = useCallback(
    (id: string) => {
      const index = Number(id);
      const { name, detail } = rows[index];
      return (
        <Link
          to={linkTo(index)}
          css={{
            gridColumn: "1/-1",
            display: "grid",
            gridTemplateColumns: "subgrid",
            textShadow: "none",
            "&:hover, &:focus-visible": {
              backgroundColor: hoverBg,
            },
          }}
        >
          <div
            css={{
              padding: "0.3em",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {name || (
              <i>
                <Translate>Unnamed</Translate>
              </i>
            )}
          </div>
          <div css={{ padding: "0.3em", fontStyle: "italic", opacity: 0.7 }}>
            {detail}
          </div>
        </Link>
      );
    },
    [hoverBg, linkTo, rows],
  );

  return (
    <div
      className={className}
      css={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <p css={{ marginTop: 0 }}>
        <Button css={{ width: "auto" }} onClick={onAdd}>
          <i className="fas fa-plus" /> <Translate>{addLabel}</Translate>
        </Button>
      </p>
      <SortableTable
        css={{ flex: 1, overflow: "auto", position: "relative" }}
        items={rows.map((_, i) => i.toString())}
        setItems={handleSetItems}
        renderItem={renderRow}
        gridTemplateColumns="1fr max-content"
        headers={[
          { label: nameHeader, id: "name" },
          { label: detailHeader, id: "detail" },
        ]}
        emptyMessage={<SettingsEmptyState message={emptyMessage} />}
      />
    </div>
  );
};

SettingsSortableList.displayName = "SettingsSortableList";
