import { cx } from "@emotion/css";
import { memo, useMemo } from "react";

import { assertGame } from "../../../functions/isGame";
import { useCombatantContext } from "./CombatantContext";

export const BottomRow = memo(function BottomRow() {
  assertGame(game);
  const localize = game.i18n.localize.bind(game.i18n);

  const { combatantState, resource, effects } = useCombatantContext();

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
              "fa-eye-slash active": combatantState.hidden,
              "fa-eye": !combatantState.hidden,
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
                active: combatantState.defeated,
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
