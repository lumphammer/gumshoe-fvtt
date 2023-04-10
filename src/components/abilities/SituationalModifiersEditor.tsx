import React, { ReactNode } from "react";
import { InvestigatorItem } from "../../module/InvestigatorItem";
import { assertAbilityDataSource } from "../../typeAssertions";
import { useListShowHideTransition } from "../transitions/useListShowHideTransition";
import { Translate } from "../Translate";
import { getListTransitionStyles } from "./getListTransitionStyles";
import { SituationalModifiersEditorRow } from "./SituationalModifiersEditorRow";

interface SituationalModifiersEditorProps {
  ability: InvestigatorItem;
}

const transitionTime = 400;

export const SituationalModifiersEditor: React.FC<
  SituationalModifiersEditorProps
> = ({ ability }: SituationalModifiersEditorProps) => {
  assertAbilityDataSource(ability.data);

  const transitionedSituationalModifiers = useListShowHideTransition(
    ability.data.data.situationalModifiers,
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
                onChangeSituation={ability.setSituationalModifierSituation}
                onChangeModifier={ability.setSituationalModifierModifier}
                onDelete={ability.deleteSituationalModifier}
              />
            </div>
          );
        },
      )}

      <button
        onClick={ability.addSituationalModifier}
        css={{
          margin: 0,
        }}
      >
        <i className="fas fa-plus" /> <Translate>Add item</Translate>
      </button>
    </div>
  );
};
