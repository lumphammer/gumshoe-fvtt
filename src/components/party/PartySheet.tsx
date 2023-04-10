import React, { useCallback, useEffect, useState } from "react";
import * as constants from "../../constants";
import { assertGame, sortEntitiesByName } from "../../functions";
import { InvestigatorActor } from "../../module/InvestigatorActor";
import { InvestigatorItem } from "../../module/InvestigatorItem";
import { runtimeConfig } from "../../runtime";
import { settings } from "../../settings";
import { AbilityDataSource } from "../../types";
import {
  assertPartyDataSource,
  isAbilityDataSource,
} from "../../typeAssertions";
import { CSSReset } from "../CSSReset";
import { ImagePickle } from "../ImagePickle";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";
import { AbilityRow } from "./AbilityRow";
import { buildRowData, getSystemAbilities } from "./functions";
import { isCategoryHeader, isTypeHeader, RowData } from "./types";

export const PartySheet: React.FC<{
  party: InvestigatorActor;
  foundryApplication: ActorSheet;
}> = ({ foundryApplication, party }) => {
  const theme =
    runtimeConfig.themes[settings.defaultThemeName.get()] ||
    runtimeConfig.themes.tealTheme;
  const [abilities, setAbilities] = useState<AbilityDataSource[]>([]);
  const [actors, setActors] = useState<InvestigatorActor[]>([]);
  const [rowData, setRowData] = useState<RowData[]>([]);
  const actorIds = party.getActorIds();

  // effect 1: keep our "abilityTuples" in sync with system setting for
  // "newPCPacks"
  useEffect(() => {
    getSystemAbilities().then(setAbilities);

    const onNewPCPacksUpdated = async (newPacks: string[]) => {
      setAbilities(await getSystemAbilities());
    };

    const onActorDeleted = (
      deletedActor: InvestigatorActor,
      something: unknown, // i cannot tell what this is supposed to be
      userId: string, // probably?
    ) => {
      assertPartyDataSource(party.data);
      const actorIds = party.data.data.actorIds.filter(
        (id) => id !== deletedActor.id,
      );
      party.update({ actorIds });
    };

    const onUpdateDeleteCreateItem = async (
      item: InvestigatorItem,
      dataDiff: any,
      options: any,
      useId: string,
    ) => {
      assertPartyDataSource(party.data);
      if (
        isAbilityDataSource(item.data) &&
        item.isOwned &&
        party.data.data.actorIds.includes(item.actor?.id ?? "")
      ) {
        setAbilities(await getSystemAbilities());
      }
    };

    // newPCPacksUpdated is a custom hook
    Hooks.on(constants.newPCPacksUpdated, onNewPCPacksUpdated);
    // standard hooks
    Hooks.on("deleteActor", onActorDeleted);
    Hooks.on("updateItem", onUpdateDeleteCreateItem);
    Hooks.on("deleteItem", onUpdateDeleteCreateItem);
    Hooks.on("createItem", onUpdateDeleteCreateItem);

    return () => {
      Hooks.off(constants.newPCPacksUpdated, onNewPCPacksUpdated);
      Hooks.off("deleteActor", onActorDeleted);
      Hooks.off("updateItem", onUpdateDeleteCreateItem);
      Hooks.off("deleteItem", onUpdateDeleteCreateItem);
      Hooks.off("createItem", onUpdateDeleteCreateItem);
    };
  }, [party]);

  // effect 2: keep our row data in sync with abilities and actors
  useEffect(() => {
    const getAbs = async () => {
      const rowData = buildRowData(abilities, actors);
      // setting row data is slow - presumably this includes rendering time
      setRowData(rowData);
    };
    getAbs();
  }, [abilities, actors]);

  // effect 3: listen for ability changes
  useEffect(() => {
    assertGame(game);
    // getting actors is fast
    const actors = actorIds.flatMap((id) => {
      assertGame(game);
      const actor = game.actors?.get(id);
      return actor ? [actor] : [];
    });
    setActors(
      sortEntitiesByName(actors).filter((actor) => actor !== undefined),
    );
  }, [actorIds]);

  // callback for removing an actor
  const onClickRemoveActor = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const actorId = e.currentTarget.dataset.actorId;
      if (actorId !== undefined) {
        party.removeActorId(actorId);
      }
    },
    [party],
  );

  assertPartyDataSource(party.data);
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
      {party.data.data.actorIds.length === 0 && (
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
          <AsyncTextInput
            value={party.getName() || ""}
            onChange={party.setName}
          />
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
            subject={party}
            application={foundryApplication}
            css={{
              height: "5em",
              width: "4em",
              transform: "rotateZ(-2deg)",
              margin: "0 auto",
            }}
          />
        </div>

        {/* Actor names */}
        {actors.map<JSX.Element>((actor, j) => {
          return (
            <div
              key={actor?.id || `missing-${j}`}
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
                  actor.sheet?.render(true);
                }}
              >
                <div
                  css={{
                    width: "3em",
                    height: "3em",
                    backgroundImage: `url(${actor.data.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    margin: "0 auto",
                  }}
                />
                {actor?.name ?? "Missing"}
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
                  data-actor-id={actor.data._id}
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
        {rowData.map<JSX.Element>((data, i) => {
          if (isTypeHeader(data)) {
            // Investigative or general
            return (
              <h1
                key={data.abilityType}
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
                {data.abilityType === constants.generalAbility ? (
                  <Translate>General</Translate>
                ) : (
                  <Translate>Investigative</Translate>
                )}
              </h1>
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
                key={data.abilityDataSource._id}
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

PartySheet.displayName = "PartySheet";
