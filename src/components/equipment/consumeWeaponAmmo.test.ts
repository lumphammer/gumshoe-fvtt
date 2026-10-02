import { describe, expect, it, vi } from "vitest";

import {
  consumeWeaponAmmo,
  getAmmoCost,
  hasAmmoFor,
} from "./consumeWeaponAmmo";

describe("consumeWeaponAmmo", () => {
  it("preserves hidden ammo until ammo use is enabled", async () => {
    const setAmmo = vi.fn(() => Promise.resolve(undefined));
    const weapon = {
      usesAmmo: false,
      ammo: { min: 0, max: 10, value: 4 },
      ammoPerShot: 2,
      ammoPerBurst: 3,
      ammoPerFullAuto: 10,
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
      ammoPerBurst: 3,
      ammoPerFullAuto: 10,
      setAmmo,
    });

    expect(setAmmo).toHaveBeenCalledExactlyOnceWith(0);
  });

  it("uses the ammo for the fire mode", async () => {
    const setAmmo = vi.fn(() => Promise.resolve(undefined));
    await consumeWeaponAmmo(
      {
        usesAmmo: true,
        ammo: { min: 0, max: 20, value: 20 },
        ammoPerShot: 1,
        ammoPerBurst: 3,
        ammoPerFullAuto: 10,
        setAmmo,
      },
      "burst",
    );
    expect(setAmmo).toHaveBeenCalledExactlyOnceWith(17);
  });
});

describe("getAmmoCost / hasAmmoFor", () => {
  const weapon = {
    usesAmmo: true,
    ammo: { min: 0, max: 20, value: 2 },
    ammoPerShot: 1,
    ammoPerBurst: 3,
    ammoPerFullAuto: 10,
  };

  it("costs by fire mode", () => {
    expect(getAmmoCost(weapon, "single")).toBe(1);
    expect(getAmmoCost(weapon, "burst")).toBe(3);
    expect(getAmmoCost(weapon, "fullAuto")).toBe(10);
  });

  it("can't fire a burst with two rounds left", () => {
    expect(hasAmmoFor(weapon, "single")).toBe(true);
    expect(hasAmmoFor(weapon, "burst")).toBe(false);
  });

  it("can't fire at all when empty, even at no cost", () => {
    expect(
      hasAmmoFor({
        ...weapon,
        ammo: { ...weapon.ammo, value: 0 },
        ammoPerShot: 0,
      }),
    ).toBe(false);
  });

  it("always can when not counting ammo", () => {
    expect(
      hasAmmoFor(
        { ...weapon, usesAmmo: false, ammo: { ...weapon.ammo, value: 0 } },
        "fullAuto",
      ),
    ).toBe(true);
  });
});
