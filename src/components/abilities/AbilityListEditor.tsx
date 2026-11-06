import type { ReactNode } from "react";

import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { Button } from "../inputs/Button";
import { useListShowHideTransition } from "../transitions/useListShowHideTransition";
import { Translate } from "../Translate";
import { getListTransitionStyles } from "./getListTransitionStyles";

const transitionTime = 400;

/** The shared presentation of unlocks and situational modifiers. */
export function AbilityListEditor<T extends { readonly id: string }>({
  entries,
  onAdd,
  children,
}: {
  entries: readonly T[];
  onAdd: () => void;
  children: (entry: T, index: number) => ReactNode;
}) {
  const transitioned = useListShowHideTransition(
    entries,
    (entry) => entry.id,
    transitionTime,
  );
  return (
    <div css={{ marginBottom: "1em" }}>
      {transitioned.map(({ item, isShowing, isEntering, key }, index) => (
        <div
          key={key}
          style={getListTransitionStyles(isShowing, isEntering, transitionTime)}
        >
          {children(item, index)}
        </div>
      ))}
      <Button onClick={onAdd} css={{ margin: 0 }}>
        <i className="fas fa-plus" /> <Translate>Add item</Translate>
      </Button>
    </div>
  );
}

export function NumberTextEditorRow({
  number,
  text,
  index,
  onChangeNumber,
  onChangeText,
  onDelete,
}: {
  number: number;
  text: string;
  index: number;
  onChangeNumber: (index: number, value: number) => void;
  onChangeText: (index: number, value: string) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <div css={{ marginBottom: "0.5em" }}>
      <div css={{ display: "flex", flexDirection: "row" }}>
        <AsyncNumberInput
          css={{ flex: 1 }}
          value={number}
          onChange={(value) => onChangeNumber(index, value)}
        />
        <Button
          kind="ghost"
          css={{ flexBasis: "min-content" }}
          onClick={() => onDelete(index)}
        >
          <i className="fas fa-trash" />
        </Button>
      </div>
      <AsyncTextInput
        value={text}
        onChange={(value) => onChangeText(index, value)}
      />
    </div>
  );
}
