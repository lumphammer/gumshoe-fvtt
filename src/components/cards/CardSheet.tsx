import { Router } from "@lumphammer/minirouter";
import { useCallback } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
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

export const CardSheet = () => {
  const { item } = useItemSheetContext();

  assertCardItem(item);

  const handleClickDiscard = useCallback(async () => {
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
  }, [item]);

  const handleClickDeactivate = useCallback(async () => {
    await item.update({ system: { active: false } });
  }, [item]);

  const handleClickActivate = useCallback(async () => {
    await item.update({ system: { active: true } });
  }, [item]);

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
            <Translate>{item.actor ? "Discard" : "Delete"}</Translate>
          </ToolbarButton>{" "}
          {item.system.active ? (
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
            opacity: item.system.active ? 1 : 0.5,
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
          <CardMain />
        </div>
      </SlideInNestedPanelRoute>
    </Router>
  );
};
