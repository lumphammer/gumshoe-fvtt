import { occupationSlotIndex } from "../../constants";
import { padLength } from "../../functions/utilities";
import { useItemPacks } from "../../hooks/useItemPacks";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type {
  PersonalDetailItem,
  PersonalDetailSystemData,
} from "../../module/items/personalDetail";
import { absoluteCover } from "../absoluteCover";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Select } from "../inputs/Select";
import { css } from "../../styled-system/css";

type PersonalDetailMainProps = {
  /** only to write through */
  item: PersonalDetailItem;
  name: string;
  system: PersonalDetailSystemData;
  /** the personal details' names, from the settings */
  detailNames: readonly string[];
  occupationLabel: string;
};

export const PersonalDetailMain = ({
  item,
  name,
  system,
  detailNames,
  occupationLabel,
}: PersonalDetailMainProps) => {
  const methods = useSystemMethods(item);
  const options = padLength(
    [...detailNames],
    system.slotIndex + 1,
    (index) => `Slot ${index + 1}`,
  );
  const compendiumPacks = useItemPacks();

  return (
    <InputGrid
      className={css({
        ...absoluteCover,
        gridTemplateRows: "auto auto auto 1fr",
      })}
    >
      <GridField label="Item Name">
        <AsyncTextInput value={name} onChange={item.setName} />
      </GridField>
      <GridField label="Slot">
        <Select
          value={system.slotIndex}
          className={css({
            width: "100%",
          })}
          onChange={(e) => {
            void methods.setSlotIndex(+e.currentTarget.value);
          }}
        >
          <option value={occupationSlotIndex}>{occupationLabel}</option>
          {options.map((option, i) => (
            <option key={option} value={i}>
              {option}
            </option>
          ))}
        </Select>
      </GridField>
      <GridField label="Compendium Pack">
        <Select
          value={system.compendiumPackId ?? ""}
          className={css({
            width: "100%",
          })}
          onChange={(e) => {
            const value =
              e.currentTarget.value === "~~~NULL~~~"
                ? null
                : e.currentTarget.value;
            void methods.setCompendiumPack(value);
          }}
        >
          <option value={"~~~NULL~~~"}>None</option>
          {compendiumPacks.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.label}
            </option>
          ))}
        </Select>
      </GridField>
      <div
        className={css({
          flex: "[1]",
          position: "relative",
          gridColumn: "1/-1",
        })}
      >
        <RichTextEditor
          html={system.notes}
          onSave={methods.setNotes}
          name="notes"
        />
      </div>
    </InputGrid>
  );
};

PersonalDetailMain.displayName = "PersonalDetailMain";
