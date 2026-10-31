import type { ReactNode } from "react";
import { memo } from "react";

import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilityItem } from "../../module/items/exports";
import type { DeepReadonly } from "../../module/snapshots/createSnapshotStore";
import type { SituationalModifier } from "../../types";
import { Button } from "../inputs/Button";
import { useListShowHideTransition } from "../transitions/useListShowHideTransition";
import { Translate } from "../Translate";
import { getListTransitionStyles } from "./getListTransitionStyles";
import { SituationalModifiersEditorRow } from "./SituationalModifiersEditorRow";

const transitionTime = 400;

interface SituationalModifiersEditorProps {
  /** Only to write through */
  item: AbilityItem;
  situationalModifiers: readonly DeepReadonly<SituationalModifier>[];
}

export const SituationalModifiersEditor = memo(
  function SituationalModifiersEditor({
    item,
    situationalModifiers,
  }: SituationalModifiersEditorProps) {
    const methods = useSystemMethods(item);
    const transitionedSituationalModifiers = useListShowHideTransition(
      situationalModifiers,
      (situationalModifier) => situationalModifier.id,
      transitionTime,
    );

    return (
      <div
        css={{
          marginBottom: "1em",
        }}
      >
        {transitionedSituationalModifiers.map<ReactNode>(
          ({ item: situationalModifier, isShowing, isEntering, key }, i) => {
            return (
              <div
                key={key}
                style={getListTransitionStyles(
                  isShowing,
                  isEntering,
                  transitionTime,
                )}
              >
                <SituationalModifiersEditorRow
                  index={i}
                  situationalModifier={situationalModifier}
                  onChangeSituation={methods.setSituationalModifierSituation}
                  onChangeModifier={methods.setSituationalModifierModifier}
                  onDelete={methods.deleteSituationalModifier}
                />
              </div>
            );
          },
        )}

        <Button
          onClick={methods.addSituationalModifier}
          css={{
            margin: 0,
          }}
        >
          <i className="fas fa-plus" /> <Translate>Add item</Translate>
        </Button>
      </div>
    );
  },
);
