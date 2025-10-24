import { useCallback, useMemo, useState } from "react";

import { SortableTable } from "../../sortableTable";
import { Item } from "./Item";

export function SortableTest() {
  const [items, setItems] = useState(
    Array.from({ length: 10 }, (_, i) => (i + 1).toString()),
  );

  const headers = useMemo(
    () => [
      { label: "Item Header", id: "itemHeader" },
      { label: "C Header", id: "cHeader" },
    ],
    [],
  );

  const renderItem = useCallback((id: string) => <Item id={id} />, []);

  return (
    <SortableTable
      items={items}
      setItems={setItems}
      renderItem={renderItem}
      gridTemplateColumns="1fr 1fr"
      headers={headers}
    />
  );
}
