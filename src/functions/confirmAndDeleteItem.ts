import { confirmADoodleDo } from "./confirmADoodleDo";

type DeletableItem = {
  name: string | null;
  actor: { name: string | null } | null;
  delete: () => Promise<unknown>;
};

/** Ask whether to delete an item (naming its owner, if any), and do it */
export const confirmAndDeleteItem = async (item: DeletableItem) => {
  const yes = await confirmADoodleDo({
    message: item.actor
      ? "DeleteActorNamesEquipmentName"
      : "DeleteEquipmentName",
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
};
