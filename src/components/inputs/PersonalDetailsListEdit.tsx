import type {
  PersonalDetail,
  PersonalDetailType,
} from "@lumphammer/investigator-fvtt-types";
import React, { useCallback } from "react";

import { Translate } from "../Translate";
import { Button } from "./Button";

type PersonalDetailsListEditProps = {
  personalDetails: PersonalDetail[];
  onChange: (value: PersonalDetail[]) => void;
};

export const PersonalDetailsListEdit = ({
  personalDetails,
  onChange,
}: PersonalDetailsListEditProps) => {
  const handleTextInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.currentTarget.dataset["index"]) {
        return;
      }
      const newList = [...personalDetails];
      newList[Number(e.currentTarget.dataset["index"])] = {
        ...newList[Number(e.currentTarget.dataset["index"])],
        name: e.currentTarget.value,
      };
      onChange(newList);
    },
    [onChange, personalDetails],
  );

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!e.currentTarget.dataset["index"]) {
        return;
      }
      const newList = [...personalDetails];
      newList[Number(e.currentTarget.dataset["index"])] = {
        ...newList[Number(e.currentTarget.dataset["index"])],
        type: e.currentTarget.value as PersonalDetailType,
      };
      onChange(newList);
    },
    [onChange, personalDetails],
  );

  const onClickDelete = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!e.currentTarget.dataset["index"]) {
        return;
      }
      const newList = [...personalDetails];
      newList.splice(Number(e.currentTarget.dataset["index"]), 1);
      onChange(newList);
    },
    [onChange, personalDetails],
  );

  const onClickAdd = useCallback(() => {
    const newList: PersonalDetail[] = [
      ...personalDetails,
      { name: "", type: "item" },
    ];
    onChange(newList);
  }, [onChange, personalDetails]);

  return (
    <div>
      {personalDetails.length === 0 && (
        <i>
          <Translate>Empty List</Translate>
        </i>
      )}
      {personalDetails.map((personalDetail, i) => (
        <div
          key={i}
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div
            css={{
              width: "14em",
              position: "relative",
            }}
          >
            <input
              data-index={i}
              type="text"
              value={personalDetail.name}
              onChange={handleTextInputChange}
            />
          </div>
          <div
            css={{
              position: "relative",
            }}
          >
            <select
              data-index={i}
              value={personalDetails[i].type}
              onChange={handleSelectChange}
            >
              <option value="text">Text</option>
              <option value="item">Item</option>
            </select>
          </div>
          <div
            css={{
              width: "6em",
              position: "relative",
            }}
          >
            <button data-index={i} onClick={onClickDelete}>
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
        <Button onClick={onClickAdd}>
          <i className="fas fa-plus" /> <Translate>Add item</Translate>
        </Button>
      </div>
    </div>
  );
};
