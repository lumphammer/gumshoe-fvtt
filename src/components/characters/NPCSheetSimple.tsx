import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useTheme } from "../../hooks/useTheme";
import { assertNPCActor } from "../../module/actors/npc";
import { CSSReset } from "../CSSReset";
import { ImagePickle } from "../ImagePickle";
import { NotesDisplay } from "../inputs/NotesDisplay";
import { LogoEditable } from "./LogoEditable";

export const NPCSheetSimple = () => {
  const { actor } = useActorSheetContext();

  assertNPCActor(actor);
  const themeName = actor.system.getSheetThemeName();
  const theme = useTheme(themeName);
  const notes = actor.system.notes.html;
  const hasNotes = notes.length > 0;

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
        display: "flex",
        alignItems: "stretch",
        alignContent: "flex-start",
        flexWrap: "wrap",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      <LogoEditable
        mainText={actor.name ?? ""}
        onChangeMainText={actor.setName}
        css={{
          fontSize: "0.66em",
          width: "100%",
        }}
      />
      <div
        css={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "row",
          gap: "1em",
        }}
      >
        <div
          css={{
            containerType: "size",
            display: "flex",
            justifyContent: "center",
            alignItems: "start",

            flex: 1,
            padding: "1em",
          }}
        >
          <ImagePickle
            css={{
              width: "100%",
              height: "auto",
              aspectRatio: "1/1",
              "@container (aspect-ratio > 1/1)": {
                width: "auto",
                height: "100%",
              },

              transform: "rotateZ(-1deg)",
            }}
          />
        </div>
        {hasNotes && (
          <NotesDisplay
            css={{
              flex: 1,
              overflow: "auto",
              background: theme.colors.backgroundPrimary,
              padding: "1em",
            }}
            html={notes}
          />
        )}
      </div>
    </CSSReset>
  );
};

NPCSheetSimple.displayName = "NPCSheetSimple";
