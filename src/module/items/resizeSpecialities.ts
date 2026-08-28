import { fixLength } from "../../functions/utilities";
import { SpecialitiesMode } from "../../types";

type SpecialitiesSettings = {
  hasSpecialities: boolean;
  rating: number;
  specialitiesMode: SpecialitiesMode;
};

export function getSpecialitiesCount({
  hasSpecialities,
  rating,
  specialitiesMode,
}: SpecialitiesSettings): number {
  if (!hasSpecialities) {
    return 0;
  }
  if (specialitiesMode === "one") {
    return rating;
  }
  switch (rating) {
    case 0:
      return 0;
    case 1:
      return 2;
    case 2:
      return 5;
    default:
      return Math.max(0, (rating - 2) * 4 + 5);
  }
}

export function resizeSpecialities(
  specialities: string[],
  settings: SpecialitiesSettings,
): string[] {
  return fixLength(specialities, getSpecialitiesCount(settings), "");
}
