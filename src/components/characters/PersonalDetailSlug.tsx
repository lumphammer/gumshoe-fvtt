import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { Slug } from "./Slug";

interface PersonalDetailSlugProps {
  actor: Actor;
  /** the personal detail item (e.g. from a snapshot) */
  detail: { id: string; name: string; img: string | null };
}

export const PersonalDetailSlug = ({
  actor,
  detail,
}: PersonalDetailSlugProps) => (
  <Slug
    item={detail}
    onClick={() => {
      // the live item, only when it's clicked
      const sheet = actor.items.get(detail.id)?.sheet;
      if (!sheet) return;
      assertApplicationV2(sheet);
      void sheet.render({ force: true });
    }}
  >
    {detail.name}
  </Slug>
);

PersonalDetailSlug.displayName = "PersonalDetailSlug";
