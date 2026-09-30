import { useNavigationContext } from "@lumphammer/minirouter";
import { useCallback, useContext } from "react";

import { DispatchContext, StateContext } from "../contexts";
import { SettingsSortableList } from "../SettingsSortableList";
import { store } from "../store";
import type { PcOrNpc } from "../types";
import { stat } from "./directions";

export const StatsListSettings = ({ which }: { which: PcOrNpc }) => {
  const stats = useContext(StateContext).settings[which];
  const dispatch = useContext(DispatchContext);
  const { navigate } = useNavigationContext();
  const ids = Object.keys(stats);

  const handleAdd = useCallback(() => {
    // new stats go on the end
    const index = Object.keys(stats).length;
    dispatch(store.creators.addStat({ which }));
    navigate("here", stat(index));
  }, [dispatch, navigate, stats, which]);

  const handleReorder = useCallback(
    (newOrder: number[]) => {
      const ids = Object.keys(stats);
      dispatch(
        store.creators.setStatOrder({
          which,
          newOrder: newOrder.map((i) => ids[i]),
        }),
      );
    },
    [dispatch, stats, which],
  );

  return (
    <SettingsSortableList
      css={{ height: "100%" }}
      rows={ids.map((id) => ({
        name: stats[id].name,
        detail: <code>{id}</code>,
      }))}
      linkTo={stat}
      onReorder={handleReorder}
      onAdd={handleAdd}
      addLabel="Add Stat"
      detailHeader="Unique Id"
    />
  );
};

StatsListSettings.displayName = "StatsListSettings";
