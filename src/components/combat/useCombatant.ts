import { useCallback, useRef } from "react";

import { assertGame } from "../../functions/utilities";
import { useRefStash } from "../../hooks/useRefStash";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";

export const useCombatant = (
  combat: InvestigatorCombat | undefined,
  id: string,
) => {
  assertGame(game);
  const combatantStash = useRefStash(combat?.combatants.get(id));

  // was previously ConfiguredObjectClassForName<"Token"> (not just "Token") but
  // I can't get TS to resolve the league type ConfiguredObjectClassForName and
  // we're not subnclassing Token anyway so this is fine
  const hoveredToken = useRef<Token | null>(null);

  const onToggleDefeatedStatus = useCallback(async () => {
    if (combatantStash.current === undefined) return;
    const isDefeated = !combatantStash.current.isDefeated;
    await combatantStash.current.update({ defeated: isDefeated });
    const token = combatantStash.current.token;
    if (!token) return;
    // Push the defeated status to the token
    const status = CONFIG.statusEffects.find(
      (e) => e.id === CONFIG.specialStatusEffects.DEFEATED,
    );
    if (!status && !token.object) return;
    const effect =
      token.actor && status ? status : CONFIG.controlIcons.defeated;
    if (token.object) {
      await (token.object as Token).toggleEffect(effect, {
        overlay: true,
        active: isDefeated,
      });
    } else {
      // @ts-expect-error not sure if fvtt-types is wrong or what
      await token.toggleActiveEffect(effect, {
        overlay: true,
        active: isDefeated,
      });
    }
  }, [combatantStash]);

  const onToggleHidden = () => {
    return combatantStash.current?.update({
      hidden: !combatantStash.current?.hidden,
    });
  };

  const onCombatantHoverIn = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      if (!canvas?.ready) return;
      const token = combatantStash.current?.token?.object;
      if (token?.isVisible) {
        if (!token.controlled) {
          // @ts-expect-error privacy means nothing
          token._onHoverIn(event);
        }
        // see comment above re: ConfiguredObjectClassForName
        hoveredToken.current = token as unknown as Token;
      }
    },
    [combatantStash],
  );

  const onCombatantHoverOut = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      if (hoveredToken.current) {
        // @ts-expect-error privacy means nothing
        hoveredToken.current?._onHoverOut(event);
      }
      hoveredToken.current = null;
    },
    [],
  );

  const onDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      combatantStash.current?.token?.actor?.sheet?.render(true);
    },
    [combatantStash],
  );

  const localize = game.i18n.localize.bind(game.i18n);

  return {
    onToggleDefeatedStatus,
    onToggleHidden,
    onCombatantHoverIn,
    onCombatantHoverOut,
    localize,
    onDoubleClick,
  };
};
