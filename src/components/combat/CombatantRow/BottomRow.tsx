import { cx } from "@emotion/css";
import { memo, useEffect, useMemo, useState } from "react";

import { assertGame } from "../../../functions/isGame";
import { systemLogger } from "../../../functions/utilities";
import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import { useCombatantContext } from "./CombatantContext";
import { registerHookHandler } from "./registerHookHandler";

const getValue = <T,>(resource: T): T | number => {
  if (
    typeof resource === "object" &&
    resource !== null &&
    "value" in resource &&
    typeof resource.value === "number"
  ) {
    return resource.value;
  } else if (typeof resource === "number") {
    return resource;
  }
  return 0;
};

export const BottomRow = memo(function BottomRow() {
  const { combatantData } = useCombatantContext();
  assertGame(game);
  const localize = game.i18n.localize.bind(game.i18n);

  const { combatant } = useCombatantContext();

  const [resource, setResource] = useState(() => getValue(combatant.resource));
  useEffect(() => {
    return registerHookHandler(
      "updateCombatant",
      (
        updatedCombatant: InvestigatorCombatant,
        updates: Combatant.UpdateData,
      ) => {
        if (updatedCombatant.id !== combatant.id) return;
        setResource(getValue(updatedCombatant.resource));
      },
    );
  }, [combatant]);

  // effects data
  const [effects, setEffects] = useState<
    SchemaField.SourceData<ActiveEffect.Schema>[]
  >([]);
  useEffect(() => {
    return combatant.actor?.registerCombatantEffectsHandler((effects) => {
      systemLogger.log("Combatant effects updated", effects);
      setEffects(effects);
    });
  }, [combatant]);

  // based on foundry's CombatTracker#_formatEffectsTooltip
  const effectsTooltip = useMemo(() => {
    if (!effects.length) return "";
    const ul = document.createElement("ul");
    ul.classList.add("effects-tooltip", "plain");
    for (const effect of effects) {
      const img = document.createElement("img");
      img.src = effect.img ?? "";
      img.alt = effect.name;
      const span = document.createElement("span");
      span.textContent = effect.name;
      const li = document.createElement("li");
      li.append(img, span);
      ul.append(li);
    }
    return ul.outerHTML;
  }, [effects]);

  return (
    <div className="combatant-controls">
      {resource !== null && (
        <div className="token-resource">
          <span className="resource">{resource}</span>
        </div>
      )}
      {game.user.isGM && (
        <>
          <button
            type="button"
            className={cx("inline-control combatant-control icon fa-solid", {
              "fa-eye-slash active": combatantData.hidden,
              "fa-eye": !combatantData.hidden,
            })}
            data-action="toggleHidden"
            data-tooltip=""
            aria-label={localize("COMBAT.ToggleVis")}
          />
          <button
            type="button"
            className={cx(
              "inline-control combatant-control icon fa-solid fa-skull",
              {
                active: combatantData.defeated,
              },
            )}
            data-action="toggleDefeated"
            data-tooltip=""
            aria-label={localize("COMBAT.ToggleDead")}
          />
        </>
      )}
      <button
        type="button"
        className="inline-control combatant-control icon fa-solid fa-bullseye-arrow"
        data-action="pingCombatant"
        data-tooltip=""
        aria-label={localize("COMBAT.PingCombatant")}
      />
      <div className="token-effects" data-tooltip-html={effectsTooltip}>
        {effects.map(
          (effect, i) =>
            effect.img && (
              <img key={i} className="token-effect" src={effect.img} />
            ),
        )}
      </div>
    </div>
  );
});
