import { ReactNode } from "react";

import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertAbilityItem } from "../../module/items/exports";
import { Button } from "../inputs/Button";
import { useListShowHideTransition } from "../transitions/useListShowHideTransition";
import { Translate } from "../Translate";
import { getListTransitionStyles } from "./getListTransitionStyles";
import { UnlocksEditorRow } from "./UnlocksEditorRow";

const transitionTime = 400;

export const UnlocksEditor = () => {
  const { item } = useItemSheetContext();
  assertAbilityItem(item);

  const transitionedUnlocks = useListShowHideTransition(
    item.system.unlocks,
    (unlock) => unlock.id,
    transitionTime,
  );

  return (
    <div
      css={{
        marginBottom: "1em",
      }}
    >
      {transitionedUnlocks.map<ReactNode>(
        ({ item: unlock, isShowing, isEntering, key }, i) => {
          return (
            <div
              key={key}
              style={getListTransitionStyles(
                isShowing,
                isEntering,
                transitionTime,
              )}
            >
              <UnlocksEditorRow
                index={i}
                unlock={unlock}
                onChangeDescription={item.system.setUnlockDescription}
                onChangeRating={item.system.setUnlockRating}
                onDelete={item.system.deleteUnlock}
              />
            </div>
          );
        },
      )}
      <Button
        onClick={item.system.addUnlock}
        css={{
          margin: 0,
        }}
      >
        <i className="fas fa-plus" /> <Translate>Add item</Translate>
      </Button>
    </div>
  );
};
