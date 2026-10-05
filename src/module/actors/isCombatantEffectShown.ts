export interface CombatantEffectLike {
  statuses: ReadonlySet<string>;
  showIcon: number | null | undefined;
  isTemporary: boolean;
}

export interface CombatantEffectConstants {
  /** `CONFIG.specialStatusEffects.DEFEATED` */
  defeatedStatusId: string;
  /** `CONST.ACTIVE_EFFECT_SHOW_ICON` */
  showIcon: { ALWAYS: number; CONDITIONAL: number };
}

/**
 * Should an applied effect be shown in the combat tracker? This matches
 * foundry's CombatTracker#_prepareTurnContext: in v14, status effects have no
 * duration, so they aren't "temporary"; they're shown because of showIcon.
 * Dead is left out because the row shows defeat itself.
 */
export function isCombatantEffectShown(
  effect: CombatantEffectLike,
  { defeatedStatusId, showIcon }: CombatantEffectConstants,
): boolean {
  if (effect.statuses.has(defeatedStatusId)) return false;
  return (
    effect.showIcon === showIcon.ALWAYS ||
    (effect.showIcon === showIcon.CONDITIONAL && effect.isTemporary)
  );
}
