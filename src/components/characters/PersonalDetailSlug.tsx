import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { assertPersonalDetailItem } from "../../module/items/personalDetail";
import { Slug } from "./Slug";

interface PersonalDetailSlugProps {
  item: InvestigatorItem;
}

export const PersonalDetailSlug = ({ item }: PersonalDetailSlugProps) => {
  assertPersonalDetailItem(item);
  const sheet = item.sheet;
  assertApplicationV2(sheet);

  return (
    <Slug
      item={item}
      key={item.id}
      onClick={() => {
        void sheet.render({ force: true });
      }}
    >
      {item.name}
    </Slug>
  );
};

PersonalDetailSlug.displayName = "PersonalDetailSlug";
