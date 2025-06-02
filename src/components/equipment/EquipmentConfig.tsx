import { useCallback } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { assertGame } from "../../functions/isGame";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertEquipmentItem } from "../../module/items/equipment";
import { settings } from "../../settings/settings";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";
import { OrphanedField } from "./OrphanedField";

export const EquipmentConfig = () => {
  const { item } = useItemSheetContext();

  assertEquipmentItem(item);

  const onClickDelete = useCallback(async () => {
    assertGame(game);
    const message = item.actor
      ? "DeleteActorNamesEquipmentName"
      : "DeleteEquipmentName";

    const yes = await confirmADoodleDo({
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
    if (yes) {
      await item.delete();
    }
  }, [item]);

  const allFields = item.system.fields;
  const knownFieldIds = Object.keys(
    settings.equipmentCategories.get()[item.system.categoryId]?.fields ?? {},
  );
  const unknownFields = Object.keys(allFields).filter(
    (fieldId) => !knownFieldIds.includes(fieldId),
  );

  return (
    <InputGrid>
      <GridField label="Category Id">
        {item.system.categoryId ? (
          <>
            <code
              css={{
                display: "inline-block",
                margin: "0.3em 1em 0.3em 0",
              }}
            >
              {item.system.categoryId}
            </code>
            <a
              css={{
                gridArea: "cog",
              }}
              onClick={async () => {
                await navigator.clipboard.writeText(item.system.categoryId);
                ui.notifications?.info(
                  `Copied category ID "${item.system.categoryId}" to clipboard`,
                );
              }}
            >
              <i className={"fa fa-copy"} />
            </a>
          </>
        ) : (
          <i>None set</i>
        )}
      </GridField>
      <GridFieldStacked
        label="Orphaned fields"
        css={{
          display: "grid",
          gridTemplateColumns: "auto auto auto auto",
          gridAutoRows: "auto",
          maxWidth: "100%",
          gap: "0.2em 2em",
        }}
      >
        {unknownFields.length === 0 && (
          <i css={{ margin: "1em" }}>
            <Translate>No Orphaned Fields</Translate>
          </i>
        )}
        {unknownFields.map((fieldId, index) => (
          <OrphanedField
            key={index}
            fieldId={fieldId}
            fieldValue={allFields[fieldId]}
            index={index}
            onDelete={(id) => {
              void item.system.deleteField(id);
            }}
          />
        ))}
      </GridFieldStacked>

      <GridFieldStacked label="Delete">
        <Button onClick={onClickDelete}>
          <Translate>Delete Item</Translate>
        </Button>
      </GridFieldStacked>
    </InputGrid>
  );
};

EquipmentConfig.displayName = "EquipmentConfig";
