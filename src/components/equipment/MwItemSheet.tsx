import React, { memo } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { assertGame } from "../../functions/isGame";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useItemSnapshot } from "../../hooks/useItemSnapshot";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertMwItem } from "../../module/items/mwItem";
import type { MwType } from "../../types";
import { absoluteCover } from "../absoluteCover";
import { ImagePickle } from "../ImagePickle";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Select } from "../inputs/Select";
import { TextInput } from "../inputs/TextInput";
import { Translate } from "../Translate";

/**
 * Reads the item through its snapshot (the item itself only to write
 * through). Memoised (it has no props).
 */
export const MwItemSheet = memo(function MwItemSheet() {
  "use memo";

  const { item } = useItemSheetContext();

  assertMwItem(item);
  const snapshot = useItemSnapshot(item);
  const { system } = snapshot;
  const methods = useSystemMethods(item);

  const { contentEditableRef, onBlur, onFocus, onInput, onKeyDown, onPaste } =
    useAsyncUpdate(snapshot.name, item.setName);
  const nameInput = useAsyncUpdate(snapshot.name, item.setName);
  // `setRange(n)` makes a setter from the system data it's called on, so
  // make it when the value's set, from the system data at the time
  const setRange = (range: 0 | 1 | 2 | 3) => (value: number) =>
    item.system.setRange(range)(value);

  const onClickDelete = async () => {
    assertGame(game);
    const message = item.actor
      ? "DeleteActorNamesEquipmentName"
      : "DeleteEquipmentName";

    const aye = await confirmADoodleDo({
      message,
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: {
        ActorName: item.actor?.name ?? "",
        EquipmentName: item.name ?? "",
      },
    });
    if (aye) {
      await item.delete();
    }
  };

  const onChangeType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    void methods.setMwType(e.currentTarget.value as MwType);
  };

  return (
    <div
      css={{
        ...absoluteCover,
        padding: "1em",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gridTemplateRows: "auto auto 1fr",
        gridTemplateAreas:
          '"image  slug      trash" ' +
          '"image  headline  headline" ' +
          '"body   body      body" ',
      }}
    >
      {/* Slug */}
      <div css={{ gridArea: "slug" }}>
        <Translate>MWItem</Translate>
      </div>

      {/* Headline */}
      <h1
        css={{ gridArea: "headline" }}
        contentEditable
        onInput={onInput}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={contentEditableRef}
      />

      {/* Image */}
      <ImagePickle
        img={snapshot.img}
        css={{
          gridArea: "image",
          transform: "rotateZ(-2deg)",
          width: "4em",
          height: "4em",
          margin: "0 1em 0.5em 0",
        }}
      />

      {/* Trash */}
      <a
        css={{
          gridArea: "trash",
        }}
        onClick={() => {
          void onClickDelete();
        }}
      >
        <i className={"fa fa-trash"} />
      </a>

      {/* Body */}
      <InputGrid
        css={{
          gridArea: "body",
          gridTemplateRows: "auto auto 1fr",
          gridAutoRows: "auto",
        }}
      >
        <GridField label="Item Name">
          <TextInput
            value={nameInput.display}
            onChange={nameInput.onChange}
            onFocus={nameInput.onFocus}
            onBlur={nameInput.onBlur}
          />
        </GridField>
        <GridField label="MwType">
          <Select
            value={system.mwType}
            onChange={onChangeType}
            css={{
              width: "100%",
            }}
          >
            <option value="tweak">Tweak</option>
            <option value="spell">Spell</option>
            <option value="cantrap">Cantrap</option>
            <option value="enchantedItem">Enchanted item</option>
            <option value="meleeWeapon">Melee weapon</option>
            <option value="missileWeapon">Missile weapon</option>
            <option value="manse">Manse</option>
            <option value="sandestin">Sandestin</option>
            <option value="retainer">Retainer</option>
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
            name="notes"
            html={system.notes}
            onSave={methods.setNotes}
            css={{
              height: "100%",
              "&&": {
                resize: "none",
              },
            }}
          />
        </div>
        {/* <GridFieldStacked label="Notes">
          <AsyncTextArea
            value={item.getNotes().source}
            onChange={item.setNotesSource}
            css={{
              height: "100%",
              "&&": {
                resize: "none",
              },
            }}
          />
        </GridFieldStacked> */}
        {system.mwType === "enchantedItem" && (
          <GridField label="Charges">
            <AsyncNumberInput
              onChange={methods.setCharges}
              value={system.charges}
              min={0}
            />
          </GridField>
        )}
        {system.mwType === "missileWeapon" && (
          <GridFieldStacked label="Ranges">
            <div
              css={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <GridFieldStacked label="Short" css={{ flex: 1 }}>
                <AsyncNumberInput
                  onChange={setRange(0)}
                  value={system.ranges[0]}
                  min={0}
                />
              </GridFieldStacked>
              <GridFieldStacked label="Medium" css={{ flex: 1 }}>
                <AsyncNumberInput
                  onChange={setRange(1)}
                  value={system.ranges[1]}
                  min={0}
                />
              </GridFieldStacked>
            </div>
            <div
              css={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <GridFieldStacked label="Long" css={{ flex: 1 }}>
                <AsyncNumberInput
                  onChange={setRange(2)}
                  value={system.ranges[2]}
                  min={0}
                />
              </GridFieldStacked>
              <GridFieldStacked label="Extreme" css={{ flex: 1 }}>
                <AsyncNumberInput
                  onChange={setRange(3)}
                  value={system.ranges[3]}
                  min={0}
                />
              </GridFieldStacked>
            </div>
          </GridFieldStacked>
        )}
      </InputGrid>
    </div>
  );
});
