import { ReactNode } from "react";

import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertAbilityItem } from "../../module/items/exports";
import { Button } from "../inputs/Button";
import { useListShowHideTransition } from "../transitions/useListShowHideTransition";
import { Translate } from "../Translate";
import { getListTransitionStyles } from "./getListTransitionStyles";
import { SituationalModifiersEditorRow } from "./SituationalModifiersEditorRow";

const transitionTime = 400;

export const SituationalModifiersEditor = () => {
  const { item } = useItemSheetContext();
  assertAbilityItem(item);

  const transitionedSituationalModifiers = useListShowHideTransition(
    item.system.situationalModifiers,
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
                onChangeSituation={item.system.setSituationalModifierSituation}
                onChangeModifier={item.system.setSituationalModifierModifier}
                onDelete={item.system.deleteSituationalModifier}
              />
            </div>
          );
        },
      )}

      <Button
        onClick={item.system.addSituationalModifier}
        css={{
          margin: 0,
        }}
      >
        <i className="fas fa-plus" /> <Translate>Add item</Translate>
      </Button>
    </div>
  );
};
