import { useNavigationContext } from "@lumphammer/minirouter";
import { useCallback, useContext } from "react";

import { DispatchContext, StateContext } from "../contexts";
import { SettingsSortableList } from "../SettingsSortableList";
import { store } from "../store";
import { equipmentCategory } from "./directions";

export const EquipmentSettings = () => {
  const dispatch = useContext(DispatchContext);
  const { settings } = useContext(StateContext);
  const { navigate } = useNavigationContext();
  const categories = settings.equipmentCategories;
  const ids = Object.keys(categories);

  const handleAdd = useCallback(() => {
    // new categories go on the end
    const index = Object.keys(categories).length;
    dispatch(store.creators.addCategory());
    navigate("here", equipmentCategory(index));
  }, [categories, dispatch, navigate]);

  const handleReorder = useCallback(
    (newOrder: number[]) => {
      const ids = Object.keys(categories);
      dispatch(
        store.creators.setCategoryOrder({
          newOrder: newOrder.map((i) => ids[i]),
        }),
      );
    },
    [categories, dispatch],
  );

  return (
    <SettingsSortableList
      css={{ height: "100%" }}
      rows={ids.map((id) => ({
        name: categories[id].name,
        detail: <code>{id}</code>,
      }))}
      linkTo={equipmentCategory}
      onReorder={handleReorder}
      onAdd={handleAdd}
      addLabel="Add Category"
      detailHeader="Unique Id"
      emptyMessage="No equipment categories yet."
    />
  );
};

EquipmentSettings.displayName = "EquipmentSettings";
