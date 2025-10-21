import React, { useCallback } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { assertGame } from "../../functions/isGame";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertMwItem } from "../../module/items/mwItem";
import { MwType } from "../../types";
import { absoluteCover } from "../absoluteCover";
import { ImagePickle } from "../ImagePickle";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { NotesEditorWithControls } from "../inputs/NotesEditorWithControls";
import { TextInput } from "../inputs/TextInput";
import { Translate } from "../Translate";

export const MwItemSheet = () => {
  const { item } = useItemSheetContext();

  assertMwItem(item);

  const name = useAsyncUpdate(item.name || "", item.setName);
  const nameInput = useAsyncUpdate(item.name || "", item.setName);

  const onClickDelete = useCallback(async () => {
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
  }, [item]);

  const onChangeType = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      void item.system.setMwType(e.currentTarget.value as MwType);
    },
    [item],
  );

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
        // false positives here because "name" gets flagged as a ref
        // eslint-disable-next-line react-hooks/refs
        onInput={name.onInput}
        // eslint-disable-next-line react-hooks/refs
        onFocus={name.onFocus}
        // eslint-disable-next-line react-hooks/refs
        onBlur={name.onBlur}
        // eslint-disable-next-line react-hooks/refs
        ref={name.contentEditableRef}
      />

      {/* Image */}
      <ImagePickle
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
          <select
            value={item.system.mwType}
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
          </select>
        </GridField>
        <NotesEditorWithControls
          allowChangeFormat
          format={item.system.notes.format}
          html={item.system.notes.html}
          source={item.system.notes.source}
          onSave={item.system.setNotes}
          css={{
            height: "100%",
            "&&": {
              resize: "none",
            },
          }}
        />

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
        {item.system.mwType === "enchantedItem" && (
          <GridField label="Charges">
            <AsyncNumberInput
              onChange={item.system.setCharges}
              value={item.system.charges}
              min={0}
            />
          </GridField>
        )}
        {item.system.mwType === "missileWeapon" && (
          <GridFieldStacked label="Ranges">
            <div
              css={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <GridFieldStacked label="Short" css={{ flex: 1 }}>
                <AsyncNumberInput
                  onChange={item.system.setRange(0)}
                  value={item.system.getRange(0)}
                  min={0}
                />
              </GridFieldStacked>
              <GridFieldStacked label="Medium" css={{ flex: 1 }}>
                <AsyncNumberInput
                  onChange={item.system.setRange(1)}
                  value={item.system.getRange(1)}
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
                  onChange={item.system.setRange(2)}
                  value={item.system.getRange(2)}
                  min={0}
                />
              </GridFieldStacked>
              <GridFieldStacked label="Extreme" css={{ flex: 1 }}>
                <AsyncNumberInput
                  onChange={item.system.setRange(3)}
                  value={item.system.getRange(3)}
                  min={0}
                />
              </GridFieldStacked>
            </div>
          </GridFieldStacked>
        )}
      </InputGrid>
    </div>
  );
};
