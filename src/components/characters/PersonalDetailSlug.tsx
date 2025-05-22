import { InvestigatorItem } from "../../module/InvestigatorItem";
import { assertPersonalDetailItem } from "../../v10Types";
import { Slug } from "./Slug";

interface PersonalDetailSlugProps {
  item: InvestigatorItem;
}

export const PersonalDetailSlug = ({ item }: PersonalDetailSlugProps) => {
  assertPersonalDetailItem(item);

  return (
    <Slug
      item={item}
      key={item.id}
      onClick={() => {
        void item.sheet?.render(true);
      }}
    >
      {item.name}
    </Slug>
  );
};

PersonalDetailSlug.displayName = "PersonalDetailSlug";
