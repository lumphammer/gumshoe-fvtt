import { openSheet } from "../functions/openSheet";
import { useItemSelector } from "../hooks/useItemSnapshot";

/** An item's name, as a link which opens its sheet */
export const ItemSheetLink = ({ item }: { item: Item.Implementation }) => {
  const name = useItemSelector(item, (snapshot) => snapshot.name);
  return (
    <a
      onClick={() => {
        openSheet(item);
      }}
    >
      {name}
    </a>
  );
};

ItemSheetLink.displayName = "ItemSheetLink";

/**
 * One of an actor's items, by id and name (e.g. from a snapshot), as a link
 * which opens its sheet. The item is only looked up when it's clicked.
 */
export const EmbeddedItemSheetLink = ({
  actor,
  id,
  name,
}: {
  actor: Actor | null;
  id: string | null;
  name: string;
}) => {
  return (
    <a
      onClick={() => {
        openSheet(actor?.items.get(id ?? ""));
      }}
    >
      {name}
    </a>
  );
};
