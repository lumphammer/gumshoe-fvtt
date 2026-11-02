import React, { useEffect, useState } from "react";

import * as constants from "../../constants";
import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { getTranslated } from "../../functions/getTranslated";
import { useActorSheetPermissions } from "../../hooks/useSheetPermissions";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useActorsSnapshot } from "../../hooks/useActorsSnapshot";
import { IsEditableContext } from "../../hooks/useIsEditable";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import type { PartyActor } from "../../module/actors/party";
import { assertPartyActor } from "../../module/actors/party";
import { callTeamCrisis } from "../../module/bonds/callTeamCrisis";
import { areBondsOn } from "../../module/stability/settings";
import { runtimeConfig } from "../../runtime";
import { CSSReset } from "../CSSReset";
import { ImagePickle } from "../ImagePickle";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";
import { AbilityRow } from "./AbilityRow";
import { buildRowData, getSystemAbilities, toMemberView } from "./functions";
import type { PartyAbilityView } from "./types";
import { isCategoryHeader, isTypeHeader } from "./types";

const PartySheetBody = ({ party }: { party: PartyActor }) => {
  "use memo";

  const header = useActorSnapshot(party, (snapshot) => ({
    name: snapshot?.name ?? "",
    img: snapshot?.img ?? null,
    actorIds:
      (snapshot?.system as { actorIds?: readonly string[] } | undefined)
        ?.actorIds ?? [],
  }));
  const defaultThemeName = useSettings((s) => s.defaultThemeName);
  const theme =
    runtimeConfig.themes[defaultThemeName] || runtimeConfig.themes["tealTheme"];
  const bondsOn = useSettings((s) => areBondsOn(s));
  const packIds = useSettings((s) => s.newPCPacks);
  // the PCs among the members, in order (any that are missing are skipped)
  const actors = useActorsSnapshot(header.actorIds, (snapshots) =>
    snapshots.flatMap((snapshot) => {
      const view = toMemberView(snapshot);
      return view ? [view] : [];
    }),
  );
  const isGM = game.user?.isGM ?? false;
  const callTeamCrisisTooltip = getTranslated("CallTeamCrisisTooltip");

  // the abilities in the packs for new PCs, which every row is drawn from
  const [abilities, setAbilities] = useState<PartyAbilityView[]>([]);
  useEffect(() => {
    let current = true;
    void getSystemAbilities(packIds).then((abilities) => {
      if (current) setAbilities(abilities);
    });
    return () => {
      current = false;
    };
  }, [packIds]);

  const rowData = buildRowData(abilities, actors);

  const onClickRemoveActor = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const actorId = e.currentTarget.dataset["actorId"];
    if (actorId !== undefined) {
      void party.system.removeActorId(actorId);
    }
  };

  return (
    <CSSReset
      mode="small"
      theme={theme}
      css={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {header.actorIds.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            padding: "1em",
            // border: `1px solid ${theme.colors.text}`,
            borderRadius: "0.5em",
            background: theme.colors.bgOpaquePrimary,
            boxShadow: `0 0 1em 0em ${theme.colors.text}`,
            fontSize: "1.4em",
            textAlign: "center",
          }}
        >
          <Translate>
            No actors in this party yet! Drag PC actors from the sidebar into
            this window to add them.
          </Translate>
        </div>
      )}
      {/* Name field */}
      <InputGrid
        css={{
          paddingBottom: "0.5em",
        }}
      >
        <GridField label="Party Name">
          <div css={{ display: "flex", gap: "0.5em" }}>
            <AsyncTextInput
              css={{ flex: 1 }}
              value={header.name}
              onChange={party.setName}
            />
            {/* Fall of DELTA GREEN: the GM calls a crisis for those present */}
            {bondsOn && isGM && (
              <Button
                data-testid="call-team-crisis"
                css={{ width: "auto", margin: 0, whiteSpace: "nowrap" }}
                title={callTeamCrisisTooltip}
                onClick={() => callTeamCrisis(party)}
              >
                <i className="fas fa-bolt" />
                <Translate>Team Crisis</Translate>
              </Button>
            )}
          </div>
        </GridField>
      </InputGrid>

      {/* Grid */}
      <div
        css={{
          flex: 1,
          display: "grid",
          gridTemplateRows: "min-content",
          gridAutoRows: "auto",
          gridTemplateColumns: "max-content",
          gridAutoColumns: "minmax(min-content, auto)",
          overflow: "auto",
          position: "relative",
        }}
      >
        {/* Top left block */}
        <div
          css={{
            gridRow: 1,
            gridColumn: 1,
            position: "sticky",
            top: 0,
            left: 0,
            background: theme.colors.bgOpaqueSecondary,
            padding: "0.5em",
            textAlign: "center",
            zIndex: 3,
          }}
        >
          <ImagePickle
            img={header.img}
            css={{
              height: "5em",
              width: "4em",
              transform: "rotateZ(-2deg)",
              margin: "0 auto",
            }}
          />
        </div>

        {/* Actor names */}
        {actors.map((actor, j) => {
          return (
            <div
              key={actor.id}
              css={{
                gridRow: 1,
                gridColumn: j + 2,
                position: "sticky",
                top: 0,
                backgroundColor: theme.colors.bgOpaquePrimary,
                padding: "0.5em",
                zIndex: 2,
                lineHeight: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "center",
              }}
            >
              <a
                css={{
                  textAlign: "center",
                  // shenanigans to get the line count limited to 2
                  display: "-webkit-box",
                  "-webkit-line-clamp": "2",
                  "-webkit-box-orient": "vertical",
                  overflow: "hidden",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  const sheet = game.actors?.get(actor.id)?.sheet;
                  if (!sheet) return;
                  assertApplicationV2(sheet);
                  void sheet.render({ force: true });
                }}
              >
                <div
                  css={{
                    width: "3em",
                    height: "3em",
                    backgroundImage: `url("${actor.img}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    margin: "0 auto",
                  }}
                />
                {actor.name}
              </a>
              <div css={{ height: "1.5em" }} />
              <div
                css={{
                  position: "absolute",
                  bottom: "0.5em",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <button
                  css={{
                    "&&": {
                      fontSize: "0.7em",
                      padding: "0.1em 0.3em",
                      border: `1px solid ${theme.colors.text}`,
                      width: "auto",
                    },
                  }}
                  data-actor-id={actor.id}
                  onClick={onClickRemoveActor}
                >
                  <Translate>REMOVE</Translate>
                </button>
              </div>
            </div>
          );
        })}

        {/* TOTAL header */}
        <div
          css={{
            gridRow: 1,
            gridColumn: actors.length + 2,
            position: "sticky",
            top: 0,
            right: 0,
            background: theme.colors.bgOpaqueSecondary,
            padding: "0.5em",
            textAlign: "center",
            zIndex: 3,
            lineHeight: 1,
          }}
        >
          <Translate>Total</Translate>
        </div>
        {/* WORKAROUND - when the entire right-hand column is `sticky`, FF
        (as of FF86) doesn't allocate space for it, so the penultimate column
        doesn't scroll past it properly. by including this "invisible",
        non-sticky copy of the top-right cell, we force FF to allocate space
        properly. On Chrome this has no effect because the space was allocated
        correctly anyway. */}
        <div
          css={{
            visibility: "hidden",
            gridRow: 1,
            gridColumn: actors.length + 2,
            top: 0,
            right: 0,
            background: theme.colors.bgOpaquePrimary,
            padding: "0.5em",
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          <Translate>Total</Translate>
        </div>

        {/* Rows */}
        {rowData.map((data, i) => {
          if (isTypeHeader(data)) {
            // Investigative or general, plus the build point totals for that
            // type - per actor, and for the party as a whole
            return (
              <React.Fragment key={data.abilityType}>
                <h1
                  css={{
                    "&&": {
                      gridRow: i + 2,
                      gridColumn: 1,
                      padding: "0.5em",
                      textAlign: "left",
                      position: "sticky",
                      left: 0,
                      // opaque so the point counters can't scroll underneath
                      background: theme.colors.bgOpaqueSecondary,
                    },
                  }}
                >
                  {data.abilityType === constants.generalAbility ? (
                    <Translate>General</Translate>
                  ) : (
                    <Translate>Investigative</Translate>
                  )}
                </h1>
                {actors.map((actor, j) => (
                  <div
                    key={actor.id}
                    css={{
                      gridRow: i + 2,
                      gridColumn: j + 2,
                      background: theme.colors.backgroundSecondary,
                      padding: "0.5em",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {data.actorTotals[actor.id] ?? 0}
                  </div>
                ))}
                <div
                  css={{
                    gridRow: i + 2,
                    gridColumn: actors.length + 2,
                    position: "sticky",
                    right: 0,
                    background: theme.colors.bgOpaqueSecondary,
                    padding: "0.5em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {data.grandTotal}
                </div>
              </React.Fragment>
            );
          } else if (isCategoryHeader(data)) {
            // Category
            return (
              <h2
                key={data.category + i}
                css={{
                  "&&": {
                    gridRow: i + 2,
                    padding: "0.5em",
                    textAlign: "left",
                    position: "sticky",
                    left: 0,
                  },
                }}
              >
                {data.category}
              </h2>
            );
          } else {
            // Actual Abilities
            return (
              <AbilityRow
                key={data.ability.uuid}
                abilityRowData={data}
                index={i}
                actors={actors}
                theme={theme}
              />
            );
          }
        })}
      </div>
    </CSSReset>
  );
};

PartySheetBody.displayName = "PartySheetBody";

/**
 * The party sheet. It reads the party and its members through snapshots, so
 * it follows them (and their ownership) without Foundry re-rendering it.
 */
export const PartySheet = () => {
  "use memo";

  const { actor: party } = useActorSheetContext();
  assertPartyActor(party);
  const { isEditable } = useActorSheetPermissions(party);
  return (
    <IsEditableContext.Provider value={isEditable}>
      <PartySheetBody party={party} />
    </IsEditableContext.Provider>
  );
};

PartySheet.displayName = "PartySheet";
