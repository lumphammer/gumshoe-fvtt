import React, { useEffect, useState } from "react";

import { openSheet } from "../../functions/openSheet";
import * as constants from "../../constants";
import { getTranslated } from "../../functions/getTranslated";
import { useSheetPermissions } from "../../hooks/useSheetPermissions";
import { SheetPermissionsContext } from "../../hooks/useIsEditable";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useActorsSnapshot } from "../../hooks/useActorsSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import type { PartyActor } from "../../module/actors/party";
import { assertPartyActor } from "../../module/actors/party";
import { callTeamCrisis } from "../../module/bonds/callTeamCrisis";
import { areBondsOn } from "../../module/stability/settings";
import { useTheme } from "../../hooks/useTheme";
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
import { floating, partyCell } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";

const PartySheetBody = ({ party }: { party: PartyActor }) => {
  const header = useActorSnapshot(party, (snapshot) => ({
    name: snapshot.name,
    img: snapshot.img ?? null,
    actorIds: snapshot.system.actorIds,
  }));
  const theme = useTheme();
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

  return (
    <CSSReset
      mode="small"
      theme={theme}
      className={css({
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
      })}
    >
      {header.actorIds.length === 0 && (
        <div
          className={floating({ kind: "overlay" })}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            padding: "1em",
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
        className={css({
          paddingBottom: "0.5em",
        })}
      >
        <GridField label="Party Name">
          <div className={css({ display: "flex", gap: "0.5em" })}>
            <AsyncTextInput
              className={css({ flex: "[1]" })}
              value={header.name}
              onChange={party.setName}
            />
            {/* Fall of DELTA GREEN: the GM calls a crisis for those present */}
            {bondsOn && isGM && (
              <Button
                data-testid="call-team-crisis"
                className={css({
                  width: "auto",
                  margin: 0,
                  whiteSpace: "nowrap",
                })}
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
        className={css({
          flex: "[1]",
          display: "grid",
          gridTemplateRows: "min-content",
          gridAutoRows: "auto",
          gridTemplateColumns: "max-content",
          gridAutoColumns: "[minmax(min-content, auto)]",
          overflow: "auto",
          position: "relative",
        })}
      >
        {/* Top left block */}
        <div
          className={cx(
            partyCell({ header: true }),
            css({
              gridRow: 1,
              gridColumn: 1,
              position: "sticky",
              top: 0,
              left: 0,
              padding: "0.5em",
              textAlign: "center",
              zIndex: 3,
            }),
          )}
        >
          <ImagePickle
            img={header.img}
            className={css({
              height: "5em",
              width: "4em",
              transform: "rotateZ(-2deg)",
              margin: "0 auto",
            })}
          />
        </div>

        {/* Actor names */}
        {actors.map((actor, j) => {
          return (
            <div
              key={actor.id}
              className={cx(
                partyCell({ header: true, odd: true }),
                css({
                  gridRow: 1,
                  position: "sticky",
                  top: 0,
                  padding: "0.5em",
                  zIndex: 2,
                  lineHeight: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "center",
                }),
              )}
              style={{ gridColumn: j + 2 }}
            >
              <a
                className={css({
                  textAlign: "center",
                  // at most 2 lines (Panda's lineClamp: the -webkit-box
                  // shenanigans, and overflow hidden)
                  lineClamp: "2",
                })}
                onClick={(e) => {
                  e.preventDefault();
                  openSheet(game.actors?.get(actor.id));
                }}
              >
                <div
                  className={css({
                    width: "3em",
                    height: "3em",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    margin: "0 auto",
                  })}
                  style={{ backgroundImage: `url("${actor.img}")` }}
                />
                {actor.name}
              </a>
              <div className={css({ height: "1.5em" })} />
              <div
                className={css({
                  position: "absolute",
                  bottom: "0.5em",
                  left: "50%",
                  transform: "translateX(-50%)",
                })}
              >
                <Button
                  kind="toolbar"
                  className={css({ fontSize: "0.7em" })}
                  data-actor-id={actor.id}
                  onClick={() => void party.system.removeActorId(actor.id)}
                >
                  <Translate>REMOVE</Translate>
                </Button>
              </div>
            </div>
          );
        })}

        {/* TOTAL header */}
        <div
          className={cx(
            partyCell({ header: true }),
            css({
              gridRow: 1,
              position: "sticky",
              top: 0,
              right: 0,
              padding: "0.5em",
              textAlign: "center",
              zIndex: 3,
              lineHeight: 1,
            }),
          )}
          style={{ gridColumn: actors.length + 2 }}
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
          className={css({
            visibility: "hidden",
            gridRow: 1,
            top: 0,
            right: 0,
            padding: "0.5em",
            textAlign: "center",
            lineHeight: 1,
          })}
          style={{ gridColumn: actors.length + 2 }}
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
                  className={cx(
                    partyCell({ header: true }),
                    css({
                      "&&": {
                        gridColumn: 1,
                        padding: "0.5em",
                        textAlign: "left",
                        position: "sticky",
                        left: 0,
                      },
                    }),
                  )}
                  style={{ gridRow: i + 2 }}
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
                    className={cx(
                      partyCell({}),
                      css({
                        padding: "0.5em",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }),
                    )}
                    style={{ gridRow: i + 2, gridColumn: j + 2 }}
                  >
                    {data.actorTotals[actor.id] ?? 0}
                  </div>
                ))}
                <div
                  className={cx(
                    partyCell({ header: true }),
                    css({
                      position: "sticky",
                      right: 0,
                      padding: "0.5em",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }),
                  )}
                  style={{ gridRow: i + 2, gridColumn: actors.length + 2 }}
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
                className={css({
                  "&&": {
                    padding: "0.5em",
                    textAlign: "left",
                    position: "sticky",
                    left: 0,
                  },
                })}
                style={{ gridRow: i + 2 }}
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
  const { actor: party } = useActorSheetContext();
  assertPartyActor(party);
  const permissions = useSheetPermissions(party);
  return (
    <SheetPermissionsContext value={permissions}>
      <PartySheetBody party={party} />
    </SheetPermissionsContext>
  );
};

PartySheet.displayName = "PartySheet";
