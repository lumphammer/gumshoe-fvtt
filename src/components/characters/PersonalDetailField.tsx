import { PCActor } from "../../module/actors/pc";
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
  const personalDetailItems =
    actor.system.getPersonalDetailsInSlotIndex(slotIndex);

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
      {personalDetailItems.map((item) => (
        <PersonalDetailSlug key={item.id} item={item} />
      ))}
      {personalDetailItems.length === 0 && (
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
