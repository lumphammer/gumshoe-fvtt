import { occupationSlotIndex } from "../../constants";
import { assertGame } from "../../functions/isGame";
import { padLength } from "../../functions/utilities";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertPersonalDetailItem } from "../../module/items/personalDetail";
import { settings } from "../../settings/settings";
import { absoluteCover } from "../absoluteCover";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { NotesEditorWithControls } from "../inputs/NotesEditorWithControls";

export const PersonalDetailMain = () => {
  const { item } = useItemSheetContext();
  assertGame(game);
  assertPersonalDetailItem(item);
  const name = item.name;
  const personalDetails = settings.personalDetails
    .get()
    .map((detail) => detail.name);
  const options = padLength(
    personalDetails,
    item.system.slotIndex + 1,
    (index) => `Slot ${index + 1}`,
  );
  const compendiumPacks = game.packs.filter(
    (pack) => pack.metadata.type === "Item",
  );

  return (
    <InputGrid
      css={{
        ...absoluteCover,
        gridTemplateRows: "auto auto auto 1fr",
      }}
    >
      <GridField label="Item Name">
        <AsyncTextInput value={name || ""} onChange={item.setName} />
      </GridField>
      <GridField label="Slot">
        <select
          value={item.system.slotIndex}
          css={{
            width: "100%",
          }}
          onChange={(e) => {
            void item.system.setSlotIndex(+e.currentTarget.value);
          }}
        >
          <option value={occupationSlotIndex}>
            {settings.occupationLabel.get()}
          </option>
          {options.map((option, i) => (
            <option key={option} value={i}>
              {option}
            </option>
          ))}
        </select>
      </GridField>
      <GridField label="Compendium Pack">
        <select
          value={item.system.compendiumPackId ?? ""}
          css={{
            width: "100%",
          }}
          onChange={(e) => {
            const value =
              e.currentTarget.value === "~~~NULL~~~"
                ? null
                : e.currentTarget.value;
            void item.system.setCompendiumPack(value);
          }}
        >
          <option value={"~~~NULL~~~"}>None</option>
          {compendiumPacks.map((pack, i) => (
            <option key={pack.collection} value={pack.collection}>
              {pack.metadata.label}
            </option>
          ))}
        </select>
      </GridField>
      <NotesEditorWithControls
        allowChangeFormat
        format={item.system.notes.format}
        html={item.system.notes.html}
        source={item.system.notes.source}
        onSave={item.system.setNotes}
      />
    </InputGrid>
  );
};

PersonalDetailMain.displayName = "PersonalDetailMain";
