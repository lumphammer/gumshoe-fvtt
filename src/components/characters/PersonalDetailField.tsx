import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { getPersonalDetailsInSlotIn } from "../../module/actors/pcDerived";
import { useIsEditable } from "../../hooks/useIsEditable";
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

  const personalDetails = useActorSnapshot(actor, (snapshot) =>
    getPersonalDetailsInSlotIn(snapshot.items, slotIndex).map((item) => ({
      id: item._id ?? "",
      name: item.name,
      img: item.img,
    })),
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
