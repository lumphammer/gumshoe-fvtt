import type { ReactNode} from "react";
import { useCallback, useContext } from "react";

import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";
import { DispatchContext, StateContext } from "../contexts";
import { store } from "../store";
import type { PcOrNpc } from "../types";
import { StatSettingsRow } from "./StatSettingsRow";

interface StatsSettingsEditorProps {
  which: PcOrNpc;
}

export const StatsSettingsEditor = (
  {
    which,
  }: StatsSettingsEditorProps,
) => {
  const stats = useContext(StateContext).settings[which];
  const dispatch = useContext(DispatchContext);
  const handleAdd = useCallback(() => {
    dispatch(store.creators.addStat({ which }));
  }, [dispatch, which]);

  return (
    <div>
      {Object.keys(stats).map<ReactNode>((key, i) => {
        return (
          <StatSettingsRow
            // we use i not key because key can be changed
            key={i}
            stat={stats[key]}
            id={key}
            index={i + 2}
            which={which}
          />
        );
      })}
      <Button onClick={handleAdd}>
        <i className="fas fa-plus" />
        <Translate>Add Stat</Translate>
      </Button>
    </div>
  );
};

StatsSettingsEditor.displayName = "StatsSettingsEditor";
