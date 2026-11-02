import { Router } from "@lumphammer/minirouter";
import { memo } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertCardItem } from "../../module/items/card";
import { absoluteCover } from "../absoluteCover";
import { ToolbarButton } from "../inputs/Button";
import { ArrowLink } from "../nestedPanels/ArrowLink";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { Translate } from "../Translate";
import { CardDisplay } from "./CardDisplay";
import { CardMain } from "./CardMain";
import { edit } from "./directions";

/**
 * Reads the card through snapshots (`CardDisplay` and `CardMain` read their
 * own), the item itself only to write through. Memoised (it has no props).
 */
export const CardSheet = memo(function CardSheet() {
  "use memo";

  const { item } = useItemSheetContext();

  assertCardItem(item);
  const active = useItemSelector(item, (snapshot) => snapshot.system.active);
  // a card can't move between actors, so this never changes
  const isOwned = item.actor !== null;

  const handleClickDiscard = async () => {
    const message = item.actor
      ? "DiscardActorNamesCardNameCard"
      : "DeleteCardName";

    const confirmText = item.actor ? "Discard" : "Delete";

    const yes = await confirmADoodleDo({
      message,
      confirmText,
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: {
        ActorName: item.actor?.name ?? "",
        CardName: item.name ?? "",
      },
    });
    if (yes) {
      void item.delete();
    }
  };

  const handleClickDeactivate = async () => {
    await item.update({ system: { active: false } });
  };

  const handleClickActivate = async () => {
    await item.update({ system: { active: true } });
  };

  return (
    <Router>
      <div
        css={{
          ...absoluteCover,
          margin: "0.5em",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          css={{
            display: "flex",
            flexDirection: "row",
            paddingBottom: "0.5em",
          }}
        >
          <ToolbarButton onClick={handleClickDiscard}>
            <Translate>{isOwned ? "Discard" : "Delete"}</Translate>
          </ToolbarButton>{" "}
          {active ? (
            <ToolbarButton onClick={handleClickDeactivate}>
              <Translate>Deactivate</Translate>
            </ToolbarButton>
          ) : (
            <ToolbarButton onClick={handleClickActivate}>
              <Translate>Activate</Translate>
            </ToolbarButton>
          )}
          <div css={{ flex: 1 }} />
          <ArrowLink to={edit()}>Edit</ArrowLink>
        </div>
        <div
          css={{
            flex: 1,
            opacity: active ? 1 : 0.5,
            transition: "opacity 200ms ease-in-out",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            // create a containment context so the card can read themes
            containerType: "inline-size",
          }}
        >
          <CardDisplay card={item} viewMode="full" />
        </div>
      </div>
      <SlideInNestedPanelRoute
        direction={edit}
        css={{ display: "flex", flexDirection: "column" }}
      >
        <div
          className="fooey"
          css={{
            // ...absoluteCover,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CardMain item={item} />
        </div>
      </SlideInNestedPanelRoute>
    </Router>
  );
});
