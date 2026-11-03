import { memo, useCallback } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { assertGame } from "../../functions/isGame";
import type {
  EquipmentCategoriesSnapshot,
  EquipmentItem,
  EquipmentSystemData,
} from "../../module/items/equipment";
import type { DeepReadonly } from "../../module/snapshots/createSnapshotStore";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";
import { OrphanedField } from "./OrphanedField";

interface EquipmentConfigProps {
  /** Only to write through (and for its actor, when deleting): read from `system`. */
  item: EquipmentItem;
  system: DeepReadonly<EquipmentSystemData>;
  categories: EquipmentCategoriesSnapshot;
}

export const EquipmentConfig = memo(function EquipmentConfig({
  item,
  system,
  categories,
}: EquipmentConfigProps) {
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

  const allFields = system.fields;
  const knownFieldIds = Object.keys(
    categories[system.categoryId]?.fields ?? {},
  );
  const unknownFields = Object.keys(allFields).filter(
    (fieldId) => !knownFieldIds.includes(fieldId),
  );

  return (
    <InputGrid>
      <GridField label="Category Id">
        {system.categoryId ? (
          <>
            <code
              css={{
                display: "inline-block",
                margin: "0.3em 1em 0.3em 0",
              }}
            >
              {system.categoryId}
            </code>
            <a
              css={{
                gridArea: "cog",
              }}
              onClick={async () => {
                await game.clipboard?.copyPlainText(system.categoryId);
                ui.notifications?.info(
                  `Copied category ID "${system.categoryId}" to clipboard`,
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
});
