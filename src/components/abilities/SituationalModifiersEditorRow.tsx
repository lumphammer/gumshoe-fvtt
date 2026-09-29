import { forwardRef, useCallback } from "react";

import type { SituationalModifier } from "../../types";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { Button } from "../inputs/Button";

interface SituationalModifiersEditorRowProps {
  situationalModifier: SituationalModifier;
  index: number;
  onChangeModifier: (index: number, rating: number) => void;
  onChangeSituation: (index: number, description: string) => void;
  onDelete: (index: number) => void;
}

export const SituationalModifiersEditorRow = forwardRef<
  HTMLDivElement,
  SituationalModifiersEditorRowProps
>(
  (
    {
      situationalModifier: { modifier, situation },
      index,
      onChangeModifier,
      onChangeSituation,
      onDelete,
    },
    ref,
  ) => {
    const onChangeRatingCallback = useCallback(
      (newVal: number) => {
        onChangeModifier(index, newVal);
      },
      [index, onChangeModifier],
    );
    const onChangeDescriptionCallback = useCallback(
      (newDescription: string) => {
        onChangeSituation(index, newDescription);
      },
      [index, onChangeSituation],
    );

    return (
      <div
        ref={ref}
        css={{
          marginBottom: "0.5em",
        }}
      >
        <div
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <AsyncNumberInput
            css={{
              flex: 1,
            }}
            value={modifier}
            onChange={onChangeRatingCallback}
          />
          <Button
            css={{
              flexBasis: "min-content",
            }}
            onClick={() => {
              onDelete(index);
            }}
          >
            <i className="fas fa-trash" />
          </Button>
        </div>
        <AsyncTextInput
          value={situation}
          onChange={onChangeDescriptionCallback}
        />
      </div>
    );
  },
);

SituationalModifiersEditorRow.displayName = "SituationalModifiersEditorRow";
