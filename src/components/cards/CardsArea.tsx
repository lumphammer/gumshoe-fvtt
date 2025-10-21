import { createDirection, Router } from "@lumphammer/minirouter";
import { useCallback, useEffect, useRef, useState } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { sortEntitiesByName } from "../../functions/utilities";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import { isCardItem } from "../../module/items/card";
import { absoluteCover } from "../absoluteCover";
import { ToolbarButton } from "../inputs/Button";
import { ArrowLink } from "../nestedPanels/ArrowLink";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { CardsAreaSettingsSheet } from "./CardsAreaSettings";
import { CategorizedCardArray } from "./CategorizedCardArray";
import { CardsAreaSettingsContext } from "./contexts";
import { CardsAreaSettings } from "./types";
import { UncategorizedCardArray } from "./UncategorizedCardArray";

const settingsDirection = createDirection("settings");

export const CardsArea = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const allCards = actor.items.filter((item) => isCardItem(item));

  // local settings state for rapid updates
  const [cardsAreaSettings, setCardsAreaSettings] = useState<CardsAreaSettings>(
    actor.system.cardsAreaSettings,
  );

  // keep local state in sync with the actor
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCardsAreaSettings({
      category: actor.system.cardsAreaSettings.category,
      sortOrder: actor.system.cardsAreaSettings.sortOrder,
      viewMode: actor.system.cardsAreaSettings.viewMode,
      columnWidth: actor.system.cardsAreaSettings.columnWidth,
    });
  }, [
    actor.system.cardsAreaSettings.category,
    actor.system.cardsAreaSettings.sortOrder,
    actor.system.cardsAreaSettings.viewMode,
    actor.system.cardsAreaSettings.columnWidth,
  ]);

  // update local state and the actor
  const updateCardsAreaSettings = useCallback(
    (update: Partial<CardsAreaSettings>) => {
      setCardsAreaSettings((current: CardsAreaSettings) => {
        const newSettings = {
          ...current,
          ...update,
        };
        // update the actor in the background
        void actor.system.setCardsAreaSettings(newSettings);
        return newSettings;
      });
    },
    [actor],
  );

  const handleClickCreateCard = useCallback(() => {
    void actor.system.createCard();
  }, [actor]);

  const handleClickEndScenario = useCallback(async () => {
    const cardsCount = actor.system.getNonContinuityCards().length;
    const yes = await confirmADoodleDo({
      message: "EndScenarioDiscardCountNonContinuityCards",
      confirmText: "EndScenario",
      cancelText: "Cancel",
      confirmIconClass: "fa-fire",
      resolveFalseOnCancel: true,
      values: {
        ActorName: actor.name ?? "",
        Count: cardsCount.toString(),
      },
    });
    if (yes) {
      void actor.system.endScenario();
    }
  }, [actor]);

  let cards =
    cardsAreaSettings.sortOrder === "atoz" ||
    cardsAreaSettings.sortOrder === "ztoa"
      ? sortEntitiesByName(allCards)
      : allCards;

  if (
    cardsAreaSettings.sortOrder === "newest" ||
    cardsAreaSettings.sortOrder === "ztoa"
  ) {
    cards = cards.reverse();
  }

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <CardsAreaSettingsContext.Provider value={cardsAreaSettings}>
      <Router>
        <div
          css={{
            ...absoluteCover,
            display: "flex",
            flexDirection: "column",
            padding: "0.5em",
          }}
        >
          <div
            css={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "end",
              flexDirection: "row",
              flexBasis: "",
              gap: "0.5em",
            }}
          >
            <ToolbarButton onClick={handleClickCreateCard}>
              {getTranslated("Create card")}
            </ToolbarButton>
            <ToolbarButton onClick={handleClickEndScenario}>
              {getTranslated("End scenario")}
            </ToolbarButton>
            <div css={{ flex: 1 }} />
            <ArrowLink to={settingsDirection()}>Settings</ArrowLink>
          </div>
          <div
            className="container-ref-haver"
            ref={containerRef}
            css={{
              flex: 1,
              overflow: "auto",
            }}
          >
            {cardsAreaSettings.category === "categorized" ? (
              <CategorizedCardArray cards={cards} />
            ) : (
              <UncategorizedCardArray cards={cards} />
            )}
          </div>
        </div>
        <SlideInNestedPanelRoute
          margin={"10em"}
          direction={settingsDirection}
          css={{ display: "flex", flexDirection: "column" }}
          closeOnClickOutside
        >
          <CardsAreaSettingsSheet
            settings={cardsAreaSettings}
            onChangeSettings={updateCardsAreaSettings}
          />
        </SlideInNestedPanelRoute>
      </Router>
    </CardsAreaSettingsContext.Provider>
  );
};
//
