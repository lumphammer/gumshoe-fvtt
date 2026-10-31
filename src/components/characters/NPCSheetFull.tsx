import { useState } from "react";

import { assertGame } from "../../functions/isGame";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useTheme } from "../../hooks/useTheme";
import { assertNPCActor } from "../../module/actors/npc";
import { absoluteCover } from "../absoluteCover";
import { CSSReset } from "../CSSReset";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { NotesTypeContext } from "../NotesTypeContext";
import { TabContainer } from "../TabContainer";
import { AbilitiesAreaEdit } from "./AbilitiesAreaEdit";
import { AbilitiesAreaPlay } from "./AbilitiesAreaPlay";
import { EditModeToggle } from "./EditModeToggle";
import { NPCSheetHeader, NPCSheetSidebar } from "./NPCSheetPanels";
import { WeaponsArea } from "./Weapons/WeaponsArea";
import { WeaponsAreaEdit } from "./Weapons/WeaponsAreaEdit";

export const NPCSheetFull = () => {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  assertGame(game);
  const themeName = actor.system.getSheetThemeName();
  const theme = useTheme(themeName);
  // kept while the sheet is open, so looking at another tab doesn't lose it
  const [abilitiesEditMode, setAbilitiesEditMode] = useState(false);
  const [combatEditMode, setCombatEditMode] = useState(false);

  return (
    <CSSReset
      theme={theme}
      mode="large"
      css={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        gridTemplateColumns: "max-content 1fr 4em",
        gap: "0.5em",
        gridTemplateAreas: '"sidebar title image" ' + '"sidebar main main" ',
      }}
    >
      <NPCSheetHeader />
      <NPCSheetSidebar />

      {/* MAIN TABS AREA */}
      <div
        css={{
          gridArea: "main",
          position: "relative",
          padding: "0.5em",
          overflow: "auto",
        }}
      >
        <TabContainer
          defaultTab="abilities"
          tabs={[
            {
              id: "abilities",
              label: "Abilities",
              content: (
                <>
                  <EditModeToggle
                    editMode={abilitiesEditMode}
                    setEditMode={setAbilitiesEditMode}
                  />
                  {abilitiesEditMode ? (
                    <AbilitiesAreaEdit npcMode />
                  ) : (
                    <AbilitiesAreaPlay flipLeftRight />
                  )}
                </>
              ),
            },
            {
              id: "combat",
              label: "Combat",
              content: (
                // out of edit mode, the tab's height, so the ready weapon can
                // sit at the bottom
                <div
                  css={{
                    height: combatEditMode ? undefined : "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <EditModeToggle
                    editMode={combatEditMode}
                    setEditMode={setCombatEditMode}
                  />
                  {combatEditMode ? (
                    <WeaponsAreaEdit />
                  ) : (
                    <div css={{ flex: 1, minHeight: 0 }}>
                      <WeaponsArea fillHeight />
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "notes",
              label: "Notes",
              content: (
                <InputGrid
                  css={{
                    ...absoluteCover,
                    gridTemplateRows: "1fr",
                    padding: "0.5em",
                  }}
                >
                  <NotesTypeContext.Provider value="npcNote">
                    <RichTextEditor
                      name="notes"
                      html={actor.system.notes}
                      onSave={actor.system.setNotes}
                    />
                  </NotesTypeContext.Provider>
                </InputGrid>
              ),
            },
            // players who can see the NPC (with Observer permission) don't get
            // to see the GM's notes
            ...(game.user.isGM
              ? [
                  {
                    id: "gmNotes",
                    label: "GM Notes",
                    content: (
                      <InputGrid
                        css={{
                          ...absoluteCover,
                          gridTemplateRows: "1fr",
                          padding: "0.5em",
                        }}
                      >
                        <NotesTypeContext.Provider value="npcNote">
                          <RichTextEditor
                            name="gmNotes"
                            html={actor.system.gmNotes}
                            onSave={actor.system.setGMNotes}
                          />
                        </NotesTypeContext.Provider>
                      </InputGrid>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>
    </CSSReset>
  );
};

NPCSheetFull.displayName = "NPCSheetFull";
