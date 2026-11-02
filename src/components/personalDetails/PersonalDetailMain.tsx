import { useMemo, useSyncExternalStore } from "react";

import { occupationSlotIndex } from "../../constants";
import { assertGame } from "../../functions/isGame";
import { padLength } from "../../functions/utilities";
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

// The Item compendiums, as "id\tlabel" lines: a string, so it only changes
// when they do
const readItemPacks = () => {
  assertGame(game);
  return game.packs
    .filter((pack) => pack.metadata.type === "Item")
    .map((pack) => `${pack.collection}\t${pack.metadata.label}`)
    .join("\n");
};

// Foundry re-renders the compendium sidebar whenever a compendium is created,
// deleted, renamed or reconfigured
const subscribeToPacks = (onChange: () => void) => {
  const id = Hooks.on("renderCompendiumDirectory", onChange);
  return () => Hooks.off("renderCompendiumDirectory", id);
};

/** The Item compendiums, following them being created, deleted or renamed */
const useItemPacks = () => {
  const packs = useSyncExternalStore(subscribeToPacks, readItemPacks);
  return useMemo(
    () =>
      packs === ""
        ? []
        : packs.split("\n").map((line) => {
            const [id = "", label = ""] = line.split("\t");
            return { id, label };
          }),
    [packs],
  );
};

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
  "use memo";

  const methods = useSystemMethods(item);
  const options = padLength(
    [...detailNames],
    system.slotIndex + 1,
    (index) => `Slot ${index + 1}`,
  );
  const compendiumPacks = useItemPacks();

  return (
    <InputGrid
      css={{
        ...absoluteCover,
        gridTemplateRows: "auto auto auto 1fr",
      }}
    >
      <GridField label="Item Name">
        <AsyncTextInput value={name} onChange={item.setName} />
      </GridField>
      <GridField label="Slot">
        <Select
          value={system.slotIndex}
          css={{
            width: "100%",
          }}
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
          css={{
            width: "100%",
          }}
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
        css={{
          flex: 1,
          position: "relative",
          gridColumn: "1/-1",
        }}
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
