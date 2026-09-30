import { useNavigationContext, useParams } from "@lumphammer/minirouter";
import { useCallback, useContext } from "react";

import { confirmADoodleDo } from "../../../functions/confirmADoodleDo";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { GridField } from "../../inputs/GridField";
import { InputGrid } from "../../inputs/InputGrid";
import { Translate } from "../../Translate";
import { DispatchContext } from "../contexts";
import { useStateSelector } from "../hooks";
import { OptionalNumberInput } from "../OptionalNumberInput";
import { SettingsIdField } from "../SettingsIdField";
import { store } from "../store";
import type { PcOrNpc } from "../types";
import { stat as statDirection } from "./directions";

export const StatSettings = ({ which }: { which: PcOrNpc }) => {
  const index = useParams(statDirection);
  const dispatch = useContext(DispatchContext);
  const { navigate } = useNavigationContext();
  // select the id and the stat separately so each is a stable value
  const { value: statId, freeze: freezeId } = useStateSelector(
    (s) => Object.keys(s.settings[which])[index] as string | undefined,
  );
  const { value: stat, freeze: freezeStat } = useStateSelector((s) =>
    statId === undefined ? undefined : s.settings[which][statId],
  );

  const handleChangeId = useCallback(
    (newStatId: string) => {
      if (statId === undefined) return;
      dispatch(
        store.creators.setStatId({ which, oldStatId: statId, newStatId }),
      );
    },
    [dispatch, statId, which],
  );

  const handleChangeName = useCallback(
    (newName: string) => {
      if (statId === undefined) return;
      dispatch(store.creators.setStatName({ which, statId, newName }));
    },
    [dispatch, statId, which],
  );

  const handleChangeDefault = useCallback(
    (newDefault: number) => {
      if (statId === undefined) return;
      dispatch(store.creators.setStatDefault({ which, statId, newDefault }));
    },
    [dispatch, statId, which],
  );

  const handleChangeMin = useCallback(
    (newMin: number | undefined) => {
      if (statId === undefined) return;
      dispatch(store.creators.setStatMin({ which, statId, newMin }));
    },
    [dispatch, statId, which],
  );

  const handleChangeMax = useCallback(
    (newMax: number | undefined) => {
      if (statId === undefined) return;
      dispatch(store.creators.setStatMax({ which, statId, newMax }));
    },
    [dispatch, statId, which],
  );

  const handleToggleMin = useCallback(
    (enabled: boolean) => {
      if (stat === undefined) return;
      handleChangeMin(
        enabled ? Math.min(stat.default, stat.max ?? 0) : undefined,
      );
    },
    [handleChangeMin, stat],
  );

  const handleToggleMax = useCallback(
    (enabled: boolean) => {
      if (stat === undefined) return;
      handleChangeMax(
        enabled ? Math.max(stat.default, stat.min ?? 0) : undefined,
      );
    },
    [handleChangeMax, stat],
  );

  const handleClickDelete = useCallback(async () => {
    if (statId === undefined) return;
    const aye = await confirmADoodleDo({
      message: "DeleteStatName",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: { Name: stat?.name || statId },
    });
    if (aye) {
      // keep showing this stat while the panel animates out, rather than
      // whatever slides into its index
      freezeId();
      freezeStat();
      navigate("here", "up");
      dispatch(store.creators.deleteStat({ which, statId }));
    }
  }, [dispatch, freezeId, freezeStat, navigate, stat?.name, statId, which]);

  if (statId === undefined || stat === undefined) {
    return null;
  }

  return (
    <InputGrid>
      <GridField label="Name">
        <AsyncTextInput value={stat.name} onChange={handleChangeName} />
      </GridField>
      <SettingsIdField
        id={statId}
        name={stat.name}
        warning="Actors store their values for this stat under its ID."
        onChange={handleChangeId}
      />
      <GridField label="Default">
        <AsyncNumberInput
          value={stat.default}
          onChange={handleChangeDefault}
          min={stat.min}
          max={stat.max}
        />
      </GridField>
      <GridField label="Min">
        <OptionalNumberInput
          value={stat.min}
          onToggle={handleToggleMin}
          onChange={handleChangeMin}
          max={stat.max}
        />
      </GridField>
      <GridField label="Max">
        <OptionalNumberInput
          value={stat.max}
          onToggle={handleToggleMax}
          onChange={handleChangeMax}
          min={stat.min}
        />
      </GridField>
      <GridField label="Delete">
        <Button css={{ width: "auto" }} onClick={handleClickDelete}>
          <i className="fas fa-trash" /> <Translate>Delete</Translate>
        </Button>
      </GridField>
    </InputGrid>
  );
};

StatSettings.displayName = "StatSettings";
