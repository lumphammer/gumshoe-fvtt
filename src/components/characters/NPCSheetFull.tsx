import { memo, useState } from "react";

import { assertGame } from "../../functions/isGame";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
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

/** The Notes or GM Notes tab, which reads only its own notes */
const NPCNotesTab = memo(function NPCNotesTab({
  field,
}: {
  field: "notes" | "gmNotes";
}) {
  "use memo";

  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  const html = useActorSnapshot(
    actor,
    (snapshot) =>
      (snapshot?.system as Record<typeof field, string> | undefined)?.[field] ??
      "",
  );
  const { setNotes, setGMNotes } = useSystemMethods(actor);

  return (
    <InputGrid
      css={{
        ...absoluteCover,
        gridTemplateRows: "1fr",
        padding: "0.5em",
      }}
    >
      <NotesTypeContext.Provider value="npcNote">
        <RichTextEditor
          name={field}
          html={html}
          onSave={field === "notes" ? setNotes : setGMNotes}
        />
      </NotesTypeContext.Provider>
    </InputGrid>
  );
});

/**
 * The NPC sheet. Memoised (it has no props), so Foundry's own re-render stops
 * here: everything below reads the actor and settings through snapshots.
 * `NPCSheet`, above, provides `SheetPermissionsContext`.
 */
export const NPCSheetFull = memo(function NPCSheetFull() {
  "use memo";

  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  assertGame(game);
  const sheetTheme = useActorSnapshot(
    actor,
    (snapshot) =>
      (snapshot?.system as { sheetTheme?: string | null } | undefined)
        ?.sheetTheme ?? null,
  );
  const defaultThemeName = useSettings((s) => s.defaultThemeName);
  const theme = useTheme(sheetTheme || defaultThemeName);
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
              content: <NPCNotesTab field="notes" />,
            },
            // players who can see the NPC (with Observer permission) don't get
            // to see the GM's notes
            ...(game.user.isGM
              ? [
                  {
                    id: "gmNotes",
                    label: "GM Notes",
                    content: <NPCNotesTab field="gmNotes" />,
                  },
                ]
              : []),
          ]}
        />
      </div>
    </CSSReset>
  );
});

NPCSheetFull.displayName = "NPCSheetFull";
