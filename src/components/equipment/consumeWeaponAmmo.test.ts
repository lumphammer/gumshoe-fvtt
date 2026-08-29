import { describe, expect, it, vi } from "vitest";

import { consumeWeaponAmmo } from "./consumeWeaponAmmo";

describe("consumeWeaponAmmo", () => {
  it("preserves hidden ammo until ammo use is enabled", async () => {
    const setAmmo = vi.fn(() => Promise.resolve(undefined));
    const weapon = {
      usesAmmo: false,
      ammo: { min: 0, max: 10, value: 4 },
      ammoPerShot: 2,
      setAmmo,
    };

    await consumeWeaponAmmo(weapon);
    expect(setAmmo).not.toHaveBeenCalled();

    weapon.usesAmmo = true;
    await consumeWeaponAmmo(weapon);
    expect(setAmmo).toHaveBeenCalledExactlyOnceWith(2);
  });

  it("does not reduce enabled ammo below zero", async () => {
    const setAmmo = vi.fn(() => Promise.resolve(undefined));

    await consumeWeaponAmmo({
      usesAmmo: true,
      ammo: { min: 0, max: 10, value: 1 },
      ammoPerShot: 2,
      setAmmo,
    });

    expect(setAmmo).toHaveBeenCalledExactlyOnceWith(0);
  });
});
