import type { Stat } from "@lumphammer/investigator-fvtt-types";
import { useCallback, useContext } from "react";

import { useRefStash } from "../../../hooks/useRefStash";
import { ThemeContext } from "../../../themes/ThemeContext";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { DispatchContext } from "../contexts";
import { store } from "../store";
import type { PcOrNpc } from "../types";

interface StatSettingsRowProps {
  index: number;
  which: PcOrNpc;
  id: string;
  stat: Stat;
}

export const StatSettingsRow = (
  {
    id,
    stat,
    index,
    which,
  }: StatSettingsRowProps,
) => {
  const dispatch = useContext(DispatchContext);
  const isEven = index % 2 === 0;
  const theme = useContext(ThemeContext);
  const statRef = useRefStash(stat);
  const idRef = useRefStash(id);

  const handleChangeMinToggle = useCallback(
    (checked: boolean) => {
      const value = checked
        ? Math.min(statRef.current.default, statRef.current.max ?? 0)
        : undefined;
      dispatch(
        store.creators.setStatMin({
          which,
          statId: idRef.current,
          newMin: value,
        }),
      );
    },
    [dispatch, which, idRef, statRef],
  );

  const handleChangeMaxToggle = useCallback(
    (checked: boolean) => {
      const value = checked
        ? Math.max(statRef.current.default, statRef.current.min ?? 0)
        : undefined;
      dispatch(
        store.creators.setStatMax({
          which,
          statId: idRef.current,
          newMax: value,
        }),
      );
    },
    [statRef, dispatch, which, idRef],
  );

  const handleChangeDefault = useCallback(
    (value: number) => {
      dispatch(
        store.creators.setStatDefault({
          which,
          statId: idRef.current,
          newDefault: value,
        }),
      );
    },
    [dispatch, which, idRef],
  );

  const handleChangeMin = useCallback(
    (value: number) => {
      dispatch(
        store.creators.setStatMin({
          which,
          statId: idRef.current,
          newMin: value,
        }),
      );
    },
    [dispatch, which, idRef],
  );

  const handleChangeMax = useCallback(
    (value: number) => {
      dispatch(
        store.creators.setStatMax({
          which,
          statId: idRef.current,
          newMax: value,
        }),
      );
    },
    [dispatch, which, idRef],
  );

  const handleChangeIdCallback = useCallback(
    (newId: string) => {
      dispatch(
        store.creators.setStatId({
          which,
          oldStatId: idRef.current,
          newStatId: newId,
        }),
      );
    },
    [dispatch, idRef, which],
  );

  const handleChangeName = useCallback(
    (name: string) => {
      dispatch(
        store.creators.setStatName({
          which,
          statId: idRef.current,
          newName: name,
        }),
      );
    },
    [dispatch, idRef, which],
  );

  const handleDelete = useCallback(() => {
    dispatch(store.creators.deleteStat({ which, statId: idRef.current }));
  }, [dispatch, which, idRef]);

  return (
    <div
      css={{
        backgroundColor: isEven ? theme.colors.backgroundPrimary : undefined,
        display: "grid",
        gridTemplateRows: "max-content",
        gridTemplateColumns: "1fr    1fr    1fr    1fr     1fr     1fr     2em",
        gridTemplateAreas: `
          "idLbl  idLbl  idLbl  nameLbl nameLbl nameLbl delete"
          "id     id     id     name    name    name    delete"
          "defLbl defLbl minLbl minLbl  maxLbl  maxLbl  delete"
          "def    def    min    min     max     max     delete"
        `,
        gap: "0.3em",
        padding: "0.5em",
      }}
    >
      <span css={{ gridArea: "idLbl" }}>id</span>
      <span css={{ gridArea: "nameLbl" }}>
        <Translate>Item Name</Translate>
      </span>
      <AsyncTextInput
        css={{ gridArea: "id" }}
        onChange={handleChangeIdCallback}
        value={id}
      />
      <AsyncTextInput
        css={{ gridArea: "name" }}
        onChange={handleChangeName}
        value={stat.name}
      />

      <span css={{ gridArea: "defLbl" }}>
        <Translate>Default</Translate>
      </span>

      <span css={{ gridArea: "minLbl" }}>
        <Translate>Min</Translate>{" "}
        <Toggle
          checked={stat.min !== undefined}
          onChange={handleChangeMinToggle}
        />
      </span>

      <span css={{ gridArea: "maxLbl" }}>
        <Translate>Max</Translate>{" "}
        <Toggle
          checked={stat.max !== undefined}
          onChange={handleChangeMaxToggle}
        />
      </span>

      {stat.default !== undefined && (
        <AsyncNumberInput
          onChange={handleChangeDefault}
          value={stat.default}
          min={stat.min}
          max={stat.max}
          css={{
            gridArea: "def",
          }}
        />
      )}
      {stat.min !== undefined ? (
        <AsyncNumberInput
          onChange={handleChangeMin}
          value={stat.min}
          max={stat.max}
          css={{
            gridArea: "min",
          }}
        />
      ) : (
        <span css={{ gridArea: "min" }} />
      )}
      {stat.max !== undefined ? (
        <AsyncNumberInput
          onChange={handleChangeMax}
          value={stat.max}
          min={stat.min}
          css={{
            gridArea: "max",
          }}
        />
      ) : (
        <span css={{ gridArea: "max" }} />
      )}
      <Button css={{ gridArea: "delete" }} onClick={handleDelete}>
        <i className="fas fa-trash" />
      </Button>
    </div>
  );
};

StatSettingsRow.displayName = "StatSettingsRow";
