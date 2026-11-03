import { openSheet } from "../../functions/openSheet";
import { Slug } from "./Slug";

interface PersonalDetailSlugProps {
  actor: Actor;
  /** the personal detail item (e.g. from a snapshot) */
  detail: { id: string; name: string; img: string | null };
}

export const PersonalDetailSlug = ({
  actor,
  detail,
}: PersonalDetailSlugProps) => {
  return (
    <Slug
      item={detail}
      onClick={() => {
        // the live item, only when it's clicked
        openSheet(actor.items.get(detail.id));
      }}
    >
      {detail.name}
    </Slug>
  );
};

PersonalDetailSlug.displayName = "PersonalDetailSlug";
