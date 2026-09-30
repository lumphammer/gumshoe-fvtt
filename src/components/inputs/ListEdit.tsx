import React, { useCallback } from "react";

import { Translate } from "../Translate";
import { Button } from "./Button";

type ListEditProps = {
  value: string[];
  onChange: (value: string[]) => void;
  nonempty?: boolean;
};

export const ListEdit = ({
  value,
  onChange,
  nonempty = false,
}: ListEditProps) => {
  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.currentTarget.dataset["index"]) {
        return;
      }
      const newList = [...value];
      newList[Number(e.currentTarget.dataset["index"])] = e.currentTarget.value;
      onChange(newList);
    },
    [onChange, value],
  );

  const onClickDelete = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!e.currentTarget.dataset["index"]) {
        return;
      }
      const newList = [...value];
      newList.splice(Number(e.currentTarget.dataset["index"]), 1);
      onChange(newList);
    },
    [onChange, value],
  );

  const onClickAdd = useCallback(() => {
    const newList = [...value, ""];
    onChange(newList);
  }, [onChange, value]);

  return (
    <div
      css={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
      }}
    >
      {value.length === 0 && (
        <i>
          <Translate>Empty List</Translate>
        </i>
      )}
      {value.map((s, i) => (
        <div
          key={i}
          css={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.5em",
          }}
        >
          <input
            css={{
              flex: 1,
              minWidth: 0,
            }}
            data-index={i}
            type="text"
            value={s}
            onChange={onInputChange}
          />
          <button
            css={{
              flex: "0 0 auto",
              width: "auto",
            }}
            data-index={i}
            onClick={onClickDelete}
            disabled={value.length < 2 && nonempty}
          >
            <i className="fas fa-trash" />
          </button>
        </div>
      ))}
      <Button
        onClick={onClickAdd}
        css={{
          width: "100%",
          margin: 0,
        }}
      >
        <i className="fas fa-plus" /> <Translate>Add item</Translate>
      </Button>
    </div>
  );
};
