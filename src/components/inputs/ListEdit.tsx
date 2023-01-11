import React, { useCallback } from "react";
import { Translate } from "../Translate";

type ListEditProps = {
  value: string[];
  onChange: (value: string[]) => void;
  nonempty?: boolean;
};

export const ListEdit: React.FC<ListEditProps> = ({
  value,
  onChange,
  nonempty = false,
}) => {
  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.currentTarget.dataset.index) {
        return;
      }
      const newList = [...value];
      newList[Number(e.currentTarget.dataset.index)] = e.currentTarget.value;
      onChange(newList);
    },
    [onChange, value],
  );

  const onClickDelete = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!e.currentTarget.dataset.index) {
        return;
      }
      const newList = [...value];
      newList.splice(Number(e.currentTarget.dataset.index), 1);
      onChange(newList);
    },
    [onChange, value],
  );

  const onClickAdd = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const newList = [...value, ""];
      onChange(newList);
    },
    [onChange, value],
  );

  return (
    <div>
      {value.length === 0 && (
        <i>
          <Translate>Empty List</Translate>
        </i>
      )}
      {value.map<JSX.Element>((s, i) => (
        <div
          key={i}
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div
            css={{
              width: "12em",
              position: "relative",
            }}
          >
            <input
              css={{
                width: "12em",
              }}
              data-index={i}
              type="text"
              value={s}
              onChange={onInputChange}
            />
          </div>
          <div
            css={{
              width: "6em",
              position: "relative",
            }}
          >
            <button
              data-index={i}
              onClick={onClickDelete}
              disabled={value.length < 2 && nonempty}
            >
              <i className="fas fa-trash" />
            </button>
          </div>
        </div>
      ))}
      <div
        css={{
          display: "flex",
          flexDirection: "row",
          width: "18em",
        }}
      >
        <button onClick={onClickAdd}>
          <i className="fas fa-plus" /> <Translate>Add item</Translate>
        </button>
      </div>
    </div>
  );
};
