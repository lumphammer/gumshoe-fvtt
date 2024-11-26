import {
  generalAbility,
  generalAbilityIcon,
  investigativeAbility,
  investigativeAbilityIcon,
  packNames,
  systemId,
} from "../constants";
import { assertReadyGame, systemLogger } from "../functions/utilities";
import * as moribundWorldData from "./moribundWorldData";
import * as niceBlackAgentsData from "./niceBlackAgentsData";
import * as nothingToFearData from "./nothingToFearData";
import * as pallidStarsData from "./pallidStarsData";
import * as pathOfCthulhuData from "./pathOfCthulhuData";
import * as srdAbilitiesData from "./srdAbilitiesData";
import {
  AbilityDump,
  GeneralAbilityTemplate,
  InvestigativeAbilityTemplate,
} from "./types";

/*
 * Ugh, sorry about the types in here. It's a mess, but the see-saw of
 * correctness vs. git-'er-done-ness has tipped right over and I can't face
 * spending a day fighting type defs.
 */

/**
 * basic template for an investigative ability.
 * we originally had one of these for each system but they were all identical.
 * if we need to add points of articulation later we can do that as needed but
 * for now this one template is fine for all systems.
 */
const investigativeTemplate: InvestigativeAbilityTemplate = {
  type: investigativeAbility,
  img: investigativeAbilityIcon,
  categoryId: "Academic",
  hasSpecialities: false,
  specialities: [],
  rating: 0,
  refreshesDaily: false,
  pool: 0,
  min: 0,
  max: 8,
  occupational: false,
  showTracker: false,
  excludeFromGeneralRefresh: false,
  hideIfZeroRated: true,
  unlocks: [],
};

/**
 * basic template for a general ability.
 * we originally had one of these for each system but they were all identical.
 * if we need to add points of articulation later we can do that as needed but
 * for now this one template is fine for all systems.
 */
const generalTemplate: GeneralAbilityTemplate = {
  type: generalAbility,
  img: generalAbilityIcon,
  canBeInvestigative: false,
  hasSpecialities: false,
  refreshesDaily: false,
  specialities: [],
  rating: 0,
  pool: 0,
  min: 0,
  max: 99,
  occupational: false,
  categoryId: "General",
  showTracker: false,
  excludeFromGeneralRefresh: false,
  goesFirstInCombat: false,
  hideIfZeroRated: false,
  unlocks: [],
};

export const emptyPack = async (
  pack: CompendiumCollection<CompendiumCollection.Metadata>,
) => {
  const content = await pack.getDocuments();
  const promises = content.map(async (item) => {
    await item.delete();
  });
  await Promise.all(promises);
};

export const findPack = (packName: string) => {
  assertReadyGame(game);
  const pack = game.packs.find(
    (p: any) => p.collection === `${systemId}.${packName}`,
  );
  return pack;
};

export const generatePacks = async <
  T extends InvestigativeAbilityTemplate | GeneralAbilityTemplate,
>(
  abilityData: AbilityDump<T>,
  template: T,
  pack: any,
) => {
  const promises = Object.keys(abilityData).map(
    async (category: keyof typeof abilityData) => {
      const abilityDatas = abilityData[category].map((data) => {
        const { name, type, img, ...rest } = data;
        return {
          type: template.type,
          name,
          img: img ?? template.img,
          system: {
            ...template,
            categoryId: category,
            ...rest,
          },
        };
      });
      const items = await Item.create(abilityDatas as any, { temporary: true });
      for (const item of items as any) {
        await pack.importDocument(item);
        systemLogger.log(
          `Imported Item ${item.name} into Compendium pack ${pack.collection}`,
        );
      }
    },
  );
  await Promise.all(promises);
};

export const initializePackGenerators = () => {
  window.generatePacks = {
    pathOfCthulhu: async () => {
      const pack = findPack(packNames.pathOfCthulhuAbilities);
      if (pack === undefined) {
        return;
      }
      await emptyPack(pack);
      await generatePacks(
        pathOfCthulhuData.investigativeAbilities,
        investigativeTemplate,
        pack,
      );
      await generatePacks(
        pathOfCthulhuData.generalAbilities,
        generalTemplate,
        pack,
      );
    },
    niceBlackAgents: async () => {
      const pack = findPack(packNames.niceBlackAgentsAbilities);
      if (pack === undefined) {
        return;
      }
      await emptyPack(pack);
      await generatePacks(
        niceBlackAgentsData.investigativeAbilities,
        investigativeTemplate,
        pack,
      );
      await generatePacks(
        niceBlackAgentsData.generalAbilities,
        generalTemplate,
        pack,
      );
    },
    nothingToFear: async () => {
      const pack = findPack(packNames.nothingToFearAbilities);
      if (pack === undefined) {
        return;
      }
      await emptyPack(pack);
      await generatePacks(
        nothingToFearData.investigativeAbilities,
        investigativeTemplate,
        pack,
      );
      await generatePacks(
        nothingToFearData.generalAbilities,
        generalTemplate,
        pack,
      );
    },
    pallidStars: async () => {
      const pack = findPack(packNames.pallidStarsAbilities);
      if (pack === undefined) {
        return;
      }
      await emptyPack(pack);
      await generatePacks(
        pallidStarsData.investigativeAbilities,
        investigativeTemplate,
        pack,
      );
      await generatePacks(
        pallidStarsData.generalAbilities,
        generalTemplate,
        pack,
      );
    },
    srdAbilities: async () => {
      const pack = findPack(packNames.srdAbilities);
      if (pack === undefined) {
        return;
      }
      await emptyPack(pack);
      await generatePacks(
        srdAbilitiesData.investigativeAbilities,
        investigativeTemplate,
        pack,
      );
      await generatePacks(
        srdAbilitiesData.generalAbilities,
        generalTemplate,
        pack,
      );
    },
    moribundWorldAbilities: async () => {
      const pack = findPack(packNames.moribundWorldAbilities);
      if (pack === undefined) {
        return;
      }
      await emptyPack(pack);
      await generatePacks(
        moribundWorldData.investigativeAbilities,
        investigativeTemplate,
        pack,
      );
      await generatePacks(
        moribundWorldData.generalAbilities,
        generalTemplate,
        pack,
      );
    },
  };
};

declare global {
  interface Window {
    generatePacks: {
      pathOfCthulhu(): Promise<void>;
      niceBlackAgents(): Promise<void>;
      nothingToFear(): Promise<void>;
      pallidStars(): Promise<void>;
      srdAbilities(): Promise<void>;
      moribundWorldAbilities(): Promise<void>;
    };
  }
}
