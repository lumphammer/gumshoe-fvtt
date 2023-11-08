import React, { Fragment, ReactNode } from "react";

import { useTheme } from "../../hooks/useTheme";
import { InvestigatorActor } from "../../module/InvestigatorActor";
import { settings } from "../../settings/settings";
import { assertNPCActor, isNPCActor } from "../../v10Types";
import { absoluteCover } from "../absoluteCover";
import { CSSReset } from "../CSSReset";
import { ImagePickle } from "../ImagePickle";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { CombatAbilityDropDown } from "../inputs/CombatAbilityDropDown";
import { InputGrid } from "../inputs/InputGrid";
import { NotesEditorWithControls } from "../inputs/NotesEditorWithControls";
import { TabContainer } from "../TabContainer";
import { Translate } from "../Translate";
import { AbilitiesAreaEdit } from "./AbilitiesAreaEdit";
import { AbilitiesAreaPlay } from "./AbilitiesAreaPlay";
import { LogoEditable } from "./LogoEditable";
import { MwInjuryStatusWidget } from "./MoribundWorld/MwInjuryStatusWidget";
import { StatField } from "./StatField";
import { TrackersArea } from "./TrackersArea";
import { WeaponsArea } from "./Weapons/WeaponsArea";
import { WeaponsAreaEdit } from "./Weapons/WeaponsAreaEdit";
import { NPCSheetFull } from "./NPCSheetFull";
import { NPCSheetSimple } from "./NPCSheetSimple";

type NPCSheetProps = {
  actor: InvestigatorActor;
  foundryApplication: ActorSheet;
};

export const NPCSheet = ({ actor, foundryApplication }: NPCSheetProps) => {
  assertNPCActor(actor);

  const user = game.user;
  const myLevel = actor.getUserLevel(user);

  const themeName = actor.getSheetThemeName();
  const theme = useTheme(themeName);
  const stats = settings.npcStats.get();
  
  if (myLevel==CONST.DOCUMENT_PERMISSION_LEVELS.OWNER || user.isGM) {
    return (
      <NPCSheetFull actor={actor} foundryApplication={foundryApplication} />
    );
  } else {
    return (
      <NPCSheetSimple actor={actor} foundryApplication={foundryApplication} />
    );
  }
};

NPCSheet.displayName = "NPCSheet";
