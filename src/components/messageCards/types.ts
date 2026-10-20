import * as constants from "../../constants";

export type AbilityCardMode =
  | typeof constants.htmlDataModeTest
  | typeof constants.htmlDataModeSpend
  | typeof constants.htmlDataModeAttack
  | typeof constants.htmlDataModeMwTest
  | typeof constants.htmlDataModeMwNegate
  | typeof constants.htmlDataModeMwWallop
  | typeof constants.htmlDataModePush
  | typeof constants.htmlDataModeBondRebuild
  | typeof constants.htmlDataModeBondEstablish
  | typeof constants.htmlDataModeBondCrisis
  | typeof constants.htmlDataModeBondCrisisCall
  | typeof constants.htmlDataModeStabilityTest
  | typeof constants.htmlDataModeNetworkContact;

export const isAbilityCardMode = (
  candidate: string,
): candidate is AbilityCardMode => {
  return (
    candidate === constants.htmlDataModeTest ||
    candidate === constants.htmlDataModeSpend ||
    candidate === constants.htmlDataModeAttack ||
    candidate === constants.htmlDataModeMwTest ||
    candidate === constants.htmlDataModeMwNegate ||
    candidate === constants.htmlDataModeMwWallop ||
    candidate === constants.htmlDataModePush ||
    candidate === constants.htmlDataModeBondRebuild ||
    candidate === constants.htmlDataModeBondEstablish ||
    candidate === constants.htmlDataModeBondCrisis ||
    candidate === constants.htmlDataModeBondCrisisCall ||
    candidate === constants.htmlDataModeStabilityTest ||
    candidate === constants.htmlDataModeNetworkContact
  );
};

export interface MWResult {
  text: string;
  color: string;
}
