import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";

import { confirmADoodleDo } from "../functions/confirmADoodleDo";
import { getTranslated } from "../functions/getTranslated";
import { assertGame } from "../functions/isGame";
import { pathOfCthulhuPreset } from "../presets";
import { settings } from "../settings/settings";
import { applyPresetSettings } from "./applyPresetSettings";

/** The Sanity & Stability settings, which the Trail of Cthulhu preset sets. */
const sanityAndStabilityKeys = [
  "useStabilityRules",
  "stabilityAbility",
  "useSanityRules",
  "sanityAbility",
  "sanityCapAbility",
  "sanityCapBase",
  "useStabilityStates",
  "stabilityStates",
  "useBonds",
  "bondRebuildSpendCategory",
  "useTrauma",
  "traumaTypes",
] as const satisfies readonly (keyof PresetV1)[];

/**
 * The Trail of Cthulhu preset gained Stability and Sanity rules after worlds
 * were already using it. We don't turn them on in those worlds by ourselves,
 * because a campaign may not want them, and a world whose preset says Trail
 * of Cthulhu may just never have picked another. So we ask its GM, once.
 *
 * New worlds get the rules from the preset on their first run, so they're
 * never asked.
 */
export const offerTrailOfCthulhuRules = async () => {
  assertGame(game);
  if (
    !game.users.activeGM?.isSelf ||
    settings.offeredTrailOfCthulhuRules.get() ||
    settings.systemPreset.get() !== "pathOfCthulhuPreset" ||
    settings.useStabilityRules.get()
  ) {
    return;
  }
  const yes = await confirmADoodleDo({
    message: "TrailOfCthulhuRulesOffer",
    confirmText: "Yes please",
    cancelText: "No thanks",
    confirmIconClass: "fa-check",
    values: {
      Settings: getTranslated("SystemNameSystemSettings", {
        SystemName: getTranslated("SystemName"),
      }),
    },
    resolveFalseOnCancel: true,
  });
  await settings.offeredTrailOfCthulhuRules.set(true);
  if (yes) {
    await applyPresetSettings(pathOfCthulhuPreset, sanityAndStabilityKeys);
  }
};
