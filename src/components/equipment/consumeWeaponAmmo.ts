import type { WeaponModel } from "../../module/items/weapon";

type WeaponAmmoSystem = Pick<
  WeaponModel,
  "usesAmmo" | "ammo" | "ammoPerShot" | "setAmmo"
>;

export const consumeWeaponAmmo = async (weapon: WeaponAmmoSystem) => {
  if (!weapon.usesAmmo) {
    return;
  }
  await weapon.setAmmo(Math.max(0, weapon.ammo.value - weapon.ammoPerShot));
};
