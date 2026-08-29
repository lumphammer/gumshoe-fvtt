export const getPushPoolWarningKeys = (
  poolCount: number,
  quickShockAbilityCount: number,
) => {
  const warnings: string[] = [];
  if (poolCount > 1) {
    warnings.push("TooManyPushPools");
  }
  if (quickShockAbilityCount > 0 && poolCount === 0) {
    warnings.push("QuickShockAbilityWithoutPushPool");
  }
  if (quickShockAbilityCount === 0 && poolCount > 0) {
    warnings.push("PushPoolWithoutQuickShockAbility");
  }
  return warnings;
};
