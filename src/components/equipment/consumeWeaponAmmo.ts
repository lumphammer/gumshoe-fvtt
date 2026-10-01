import type { FireMode } from "../../module/attacks/rules";
import type { WeaponModel } from "../../module/items/weapon";

type WeaponAmmoSystem = Pick<
  WeaponModel,
  "usesAmmo" | "ammo" | "ammoPerShot" | "ammoPerBurst" | "ammoPerFullAuto"
>;

/** How many rounds an attack in this fire mode uses */
export function getAmmoCost(
  weapon: WeaponAmmoSystem,
  fireMode: FireMode = "single",
): number {
  switch (fireMode) {
    case "single":
      return weapon.ammoPerShot;
    case "burst":
      return weapon.ammoPerBurst;
    case "fullAuto":
      return weapon.ammoPerFullAuto;
  }
}

/**
 * Whether the weapon has enough ammo for an attack in this fire mode. Weapons
 * which don't count ammo always do - which is the default in Fall of DELTA
 * GREEN, where you reload when it's dramatic (p. 096).
 */
export function hasAmmoFor(
  weapon: WeaponAmmoSystem,
  fireMode: FireMode = "single",
): boolean {
  if (!weapon.usesAmmo) return true;
  return (
    weapon.ammo.value > 0 && weapon.ammo.value >= getAmmoCost(weapon, fireMode)
  );
}

export const consumeWeaponAmmo = async (
  weapon: WeaponAmmoSystem & Pick<WeaponModel, "setAmmo">,
  fireMode: FireMode = "single",
) => {
  if (!weapon.usesAmmo) {
    return;
  }
  await weapon.setAmmo(
    Math.max(0, weapon.ammo.value - getAmmoCost(weapon, fireMode)),
  );
};
