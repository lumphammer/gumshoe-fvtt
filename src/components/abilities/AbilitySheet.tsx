import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import { isInvestigativeAbilityItem } from "../../module/items/investigativeAbility";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { settings } from "../../settings/settings";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { Translate } from "../Translate";
import { AbilityConfig } from "./AbilityConfig";
import { AbilityMainBits } from "./AbilityMainBits";
import { AbilityMwExtraFields } from "./AbilityMwExtraFields";
import { AbilityTest } from "./AbilityTest";
import { AbilityTestMW } from "./AbilityTestMW";
import { PushPoolButton } from "./PushPoolButton";

const settingsUseMwStyleAbilities = settings.useMwStyleAbilities.get;

function getTopAreaContent(ability: InvestigatorItem) {
  if (
    // if we're doing WM, we show the MW test/spend box
    ability.isOwned &&
    settingsUseMwStyleAbilities()
  ) {
    return <AbilityTestMW />;
  } else if (
    // push pools get a PUSH button
    (isGeneralAbilityItem(ability) && ability.system.isPushPool) ||
    (isInvestigativeAbilityItem(ability) && ability.system.isQuickShock)
  ) {
    return <PushPoolButton />;
  } else {
    // everything else gets a spend/test box
    return <AbilityTest />;
  }
}

export const AbilitySheet = () => {
  const { item: ability } = useItemSheetContext();

  const isGeneral = isGeneralAbilityItem(ability);

  return (
    <ItemSheetFramework
      supertitle={
        <>
          <Translate>
            {isGeneral ? "General ability" : "Investigative ability"}
          </Translate>
          {ability.actor && <span> ({ability.actor.name})</span>}
        </>
      }
    >
      <ModeSelect mode={ItemSheetMode.Config}>
        <AbilityConfig />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Main}>
        <>
          {/* Spending/testing area */}
          {getTopAreaContent(ability)}

          {/* Other bits */}
          <AbilityMainBits />
          {settingsUseMwStyleAbilities() && <AbilityMwExtraFields />}
        </>
      </ModeSelect>
    </ItemSheetFramework>
  );
};
