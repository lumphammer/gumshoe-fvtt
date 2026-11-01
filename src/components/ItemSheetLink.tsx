import { assertApplicationV2 } from "../functions/assertApplicationV2";
import { useItemSelector } from "../hooks/useItemSnapshot";

/** An item's name, as a link which opens its sheet */
export const ItemSheetLink = ({ item }: { item: Item.Implementation }) => {
  const name = useItemSelector(item, (snapshot) => snapshot.name);
  return (
    <a
      onClick={() => {
        const sheet = item.sheet;
        assertApplicationV2(sheet);
        void sheet.render({ force: true });
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
}) => (
  <a
    onClick={() => {
      const sheet = actor?.items.get(id ?? "")?.sheet;
      if (!sheet) return;
      assertApplicationV2(sheet);
      void sheet.render({ force: true });
    }}
  >
    {name}
  </a>
);
