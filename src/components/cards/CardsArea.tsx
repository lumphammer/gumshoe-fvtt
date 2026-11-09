import { createDirection, Router } from "@lumphammer/minirouter";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { sortEntitiesByName } from "../../functions/utilities";
import * as c from "../../constants";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertPCActor } from "../../module/actors/pc";
import { absoluteCover } from "../absoluteCover";
import { ToolbarButton } from "../inputs/Button";
import { ArrowLink } from "../nestedPanels/ArrowLink";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { CardsAreaSettingsSheet } from "./CardsAreaSettings";
import { CategorizedCardArray } from "./CategorizedCardArray";
import { CardsAreaSettingsContext } from "./contexts";
import type { CardLayoutView } from "./functions";
import type { CardsAreaSettings } from "./types";
import { UncategorizedCardArray } from "./UncategorizedCardArray";

const settingsDirection = createDirection("settings");

/**
 * The PC's cards. Reads the actor through a snapshot, selecting what decides
 * the layout and the categories' counts (each card's name, whether it's
 * active, and its categories), and the tab's own settings. Each card reads
 * its own data (`CardArrayCard`), and the lists read the categories.
 */
export const CardsArea = memo(function CardsArea() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const { allCards, savedSettings } = useActorSnapshot(actor, (snapshot) => ({
    allCards: snapshot.items
      .filter((item) => item.type === c.card)
      .map((item): CardLayoutView => ({
        id: item._id ?? "",
        name: item.name,
        system: {
          active: item.system.active,
          cardCategoryMemberships: item.system.cardCategoryMemberships,
        },
      })),
    savedSettings: snapshot.system.cardsAreaSettings,
  }));
  const methods = useSystemMethods(actor);

  // local settings state for rapid updates
  const [cardsAreaSettings, setCardsAreaSettings] = useState<CardsAreaSettings>(
    () => ({ ...savedSettings }),
  );

  // keep local state in sync with the actor
  useEffect(() => {
    setCardsAreaSettings({
      category: savedSettings.category,
      sortOrder: savedSettings.sortOrder,
      viewMode: savedSettings.viewMode,
      columnWidth: savedSettings.columnWidth,
    });
  }, [
    savedSettings.category,
    savedSettings.sortOrder,
    savedSettings.viewMode,
    savedSettings.columnWidth,
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
        void methods.setCardsAreaSettings(newSettings);
        return newSettings;
      });
    },
    [methods],
  );

  const handleClickCreateCard = useCallback(() => {
    void methods.createCard();
  }, [methods]);

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
      void methods.endScenario();
    }
  }, [actor, methods]);

  let cards =
    cardsAreaSettings.sortOrder === "atoz" ||
    cardsAreaSettings.sortOrder === "ztoa"
      ? sortEntitiesByName(allCards)
      : [...allCards];

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
});
//
