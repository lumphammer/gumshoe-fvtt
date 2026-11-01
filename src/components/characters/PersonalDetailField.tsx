import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useIsEditable } from "../../hooks/useIsEditable";
import * as c from "../../constants";
import type { PCActor } from "../../module/actors/pc";
import { GridField } from "../inputs/GridField";
import { PersonalDetailSlug } from "./PersonalDetailSlug";
import { Slug } from "./Slug";

export const PersonalDetailField = ({
  actor,
  name,
  slotIndex,
}: {
  actor: PCActor;
  name: string;
  slotIndex: number;
}) => {
  "use memo";

  // as `actor.system.getPersonalDetailsInSlotIndex`, from the snapshot
  const personalDetails = useActorSnapshot(actor, (snapshot) =>
    (snapshot?.items ?? [])
      .filter(
        (item) =>
          item.type === c.personalDetail &&
          (item.system as { slotIndex: number }).slotIndex === slotIndex,
      )
      .map((item) => ({ id: item._id ?? "", name: item.name, img: item.img })),
  );
  const isEditable = useIsEditable();

  return (
    <GridField
      noTranslate
      label={name}
      css={{
        position: "relative",
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        // alignItems: "center",
        // justifyContent: "end",
      }}
    >
      {personalDetails.map((detail) => (
        <PersonalDetailSlug key={detail.id} actor={actor} detail={detail} />
      ))}
      {personalDetails.length === 0 && isEditable && (
        <Slug
          onClick={() => {
            void actor.system.createPersonalDetail(slotIndex); //
          }}
        >
          Create
        </Slug>
      )}
    </GridField>
  );
};

PersonalDetailField.displayName = "ShortNotesField";
