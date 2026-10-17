import { assertApplicationV2 } from "../functions/assertApplicationV2";

/** An item's name, as a link which opens its sheet */
export const ItemSheetLink = ({ item }: { item: Item }) => {
  const sheet = item.sheet;
  assertApplicationV2(sheet);
  return <a onClick={() => sheet.render({ force: true })}>{item.name}</a>;
};

ItemSheetLink.displayName = "ItemSheetLink";
