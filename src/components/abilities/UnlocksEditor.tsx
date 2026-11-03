import type { ReactNode } from "react";
import { memo } from "react";

import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilityItem } from "../../module/items/exports";
import type { DeepReadonly } from "../../module/snapshots/createSnapshotStore";
import type { Unlock } from "../../types";
import { Button } from "../inputs/Button";
import { useListShowHideTransition } from "../transitions/useListShowHideTransition";
import { Translate } from "../Translate";
import { getListTransitionStyles } from "./getListTransitionStyles";
import { UnlocksEditorRow } from "./UnlocksEditorRow";

const transitionTime = 400;

interface UnlocksEditorProps {
  /** Only to write through */
  item: AbilityItem;
  unlocks: readonly DeepReadonly<Unlock>[];
}

export const UnlocksEditor = memo(function UnlocksEditor({
  item,
  unlocks,
}: UnlocksEditorProps) {
  const methods = useSystemMethods(item);
  const transitionedUnlocks = useListShowHideTransition(
    unlocks,
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
                onChangeDescription={methods.setUnlockDescription}
                onChangeRating={methods.setUnlockRating}
                onDelete={methods.deleteUnlock}
              />
            </div>
          );
        },
      )}
      <Button
        onClick={methods.addUnlock}
        css={{
          margin: 0,
        }}
      >
        <i className="fas fa-plus" /> <Translate>Add item</Translate>
      </Button>
    </div>
  );
});
