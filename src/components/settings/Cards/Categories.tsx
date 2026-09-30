import { useNavigationContext } from "@lumphammer/minirouter";
import { nanoid } from "nanoid";
import { useCallback, useContext } from "react";

import { DispatchContext, StateContext } from "../contexts";
import { SettingsSortableList } from "../SettingsSortableList";
import { store } from "../store";
import { cardCategory } from "./directions";

export const Categories = ({ className }: { className?: string }) => {
  const { settings } = useContext(StateContext);
  const dispatch = useContext(DispatchContext);
  const { navigate } = useNavigationContext();
  const categories = settings.cardCategories;

  const handleAdd = useCallback(() => {
    // new categories go on the end
    const index = categories.length;
    dispatch(store.creators.addCardCategory({ id: nanoid() }));
    navigate("here", cardCategory(index));
  }, [categories.length, dispatch, navigate]);

  const handleReorder = useCallback(
    (newOrder: number[]) => {
      dispatch(
        store.creators.setCardCategories({
          newCardCategories: newOrder.map((i) => categories[i]),
        }),
      );
    },
    [categories, dispatch],
  );

  return (
    <SettingsSortableList
      className={className}
      rows={categories.map((category) => ({
        name: category.singleName,
        detail: category.styleKey,
      }))}
      linkTo={cardCategory}
      onReorder={handleReorder}
      onAdd={handleAdd}
      addLabel="Add card category"
      detailHeader="Style Key"
      emptyMessage="No card categories have been added yet."
    />
  );
};

Categories.displayName = "Categories";
