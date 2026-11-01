import { createDirection, Router } from "@lumphammer/minirouter";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { sortEntitiesByName } from "../../functions/utilities";
import * as c from "../../constants";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertPCActor } from "../../module/actors/pc";
import type { CardItem } from "../../module/items/card";
import { absoluteCover } from "../absoluteCover";
import { ToolbarButton } from "../inputs/Button";
import { ArrowLink } from "../nestedPanels/ArrowLink";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { CardsAreaSettingsSheet } from "./CardsAreaSettings";
import { CategorizedCardArray } from "./CategorizedCardArray";
import { CardsAreaSettingsContext } from "./contexts";
import type { CardsAreaSettings } from "./types";
import { UncategorizedCardArray } from "./UncategorizedCardArray";

const settingsDirection = createDirection("settings");

/**
 * The PC's cards. Reads the actor through a snapshot, selecting what decides
 * the layout and the categories' counts (each card's name, whether it's
 * active, and its categories), and the tab's own settings. Each card reads
 * its own data (`CardArrayCard`).
 */
export const CardsArea = memo(function CardsArea() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const { cardIds, savedSettings } = useActorSnapshot(actor, (snapshot) => {
    const cards = (snapshot?.items ?? []).filter(
      (item) => item.type === c.card,
    );
    return {
      // the live cards are looked up from these; the rest is selected so this
      // re-renders (and recategorises) when it changes
      cardIds: cards.map((item) => item._id ?? ""),
      layout: cards.map((item) => {
        const system = item.system as {
          active: boolean;
          cardCategoryMemberships: unknown;
        };
        return [item.name, system.active, system.cardCategoryMemberships];
      }),
      savedSettings:
        (
          snapshot?.system as
            | { cardsAreaSettings: CardsAreaSettings }
            | undefined
        )?.cardsAreaSettings ?? actor.system.cardsAreaSettings,
    };
  });
  // the categories, which the arrays group by
  useSettings((s) => s.cardCategories);
  const allCards = cardIds.flatMap((id) => {
    const item = actor.items.get(id) as CardItem | undefined;
    return item ? [item] : [];
  });
  const methods = useSystemMethods(actor);

  // local settings state for rapid updates
  const [cardsAreaSettings, setCardsAreaSettings] = useState<CardsAreaSettings>(
    () => ({ ...savedSettings }),
  );

  // keep local state in sync with the actor
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
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
