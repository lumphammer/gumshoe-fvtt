import { memo, useCallback } from "react";

import * as c from "../../constants";
import { occupationSlotIndex } from "../../constants";
import { assertGame } from "../../functions/isGame";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertPCActor } from "../../module/actors/pc";
import type { PersonalDetailItem } from "../../module/items/personalDetail";
import { ImagePickle } from "../ImagePickle";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { IndexedAsyncTextInput } from "../inputs/IndexedAsyncTextInput";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";
import { LogoEditable } from "./LogoEditable";
import { MwInjuryStatusWidget } from "./MoribundWorld/MwInjuryStatusWidget";
import { PersonalDetailField } from "./PersonalDetailField";
import { CombatStats } from "./Weapons/CombatStats";
import { TrackersArea } from "./TrackersArea";
import { Panel } from "../Panel";
import { css } from "../../styled-system/css";

// The PC sheet's panels subscribe independently to the data they display.
// Foundry root re-renders are disabled; descendants keep themselves current.

/** The personal detail items, as shown in the header and stats panel */
const usePersonalDetails = () => {
  const { actor } = useActorSheetContext();
  return useActorSnapshot(actor, (snapshot) =>
    snapshot.items
      .filter((item) => item.type === c.personalDetail)
      .map((item) => ({
        id: item._id ?? "",
        name: item.name,
        img: item.img,
        slotIndex: item.system.slotIndex,
      })),
  );
};

/** The name and occupation, and the portrait */
export const PCSheetHeader = memo(function PCSheetHeader() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const header = useActorSnapshot(actor, (snapshot) => ({
    name: snapshot.name,
    img: snapshot.img,
  }));
  const genericOccupation = useSettings((s) => s.genericOccupation);
  const occupationData = usePersonalDetails().find(
    (item) => item.slotIndex === occupationSlotIndex,
  );
  const occupation = occupationData
    ? (actor.items.get(occupationData.id) as PersonalDetailItem | undefined)
    : undefined;

  return (
    <>
      <div
        className={css({
          gridArea: "title",
          textAlign: "center",
          position: "relative",
        })}
      >
        <LogoEditable
          mainText={header.name}
          subText={occupationData?.name ?? genericOccupation}
          defaultSubText={genericOccupation}
          onChangeMainText={actor.setName}
          onChangeSubText={occupation?.setName}
        />
      </div>
      <ImagePickle
        img={header.img}
        className={css({
          gridArea: "image",
          transform: "rotateZ(2deg)",
        })}
      />
    </>
  );
});

/** Name, occupation, personal details and short notes */
export const PCSheetStats = memo(function PCSheetStats() {
  assertGame(game);
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const stats = useActorSnapshot(actor, (snapshot) => ({
    name: snapshot.name,
    shortNotes: snapshot.system.shortNotes,
    hiddenShortNotes: snapshot.system.hiddenShortNotes,
  }));
  const { personalDetails, shortHiddenNotesNames, occupationLabel } =
    useSettings((s) => ({
      personalDetails: s.personalDetails,
      shortHiddenNotesNames: s.mwHiddenShortNotes,
      occupationLabel: s.occupationLabel,
    }));
  const { setShortNote, setMwHiddenShortNote } = useSystemMethods(actor);

  const updateShortNote = useCallback(
    async (value: string, index: number) => {
      await setShortNote(index, value);
    },
    [setShortNote],
  );
  const updateMwHiddenShortNote = useCallback(
    async (value: string, index: number) => {
      await setMwHiddenShortNote(index, value);
    },
    [setMwHiddenShortNote],
  );

  return (
    <Panel
      className={css({
        gridArea: "stats",
        position: "relative",
      })}
    >
      <InputGrid>
        <GridField label="Person Name">
          <AsyncTextInput value={stats.name} onChange={actor.setName} />
        </GridField>
        <PersonalDetailField
          name={occupationLabel}
          actor={actor}
          slotIndex={occupationSlotIndex}
        />
        {personalDetails.map(({ name, type }, i) =>
          type === "text" ? (
            <GridField noTranslate key={`${name}--${i}`} label={name}>
              <IndexedAsyncTextInput
                value={stats.shortNotes[i]}
                onChange={updateShortNote}
                index={i}
              />
            </GridField>
          ) : (
            <PersonalDetailField
              key={`${name}--${i}`}
              name={name}
              actor={actor}
              slotIndex={i}
            />
          ),
        )}
        {game.user.isGM &&
          shortHiddenNotesNames.map((name, i) => (
            <GridField noTranslate key={`${name}--${i}`} label={name}>
              <IndexedAsyncTextInput
                value={stats.hiddenShortNotes[i]}
                onChange={updateMwHiddenShortNote}
                index={i}
              />
            </GridField>
          ))}
      </InputGrid>
    </Panel>
  );
});

/** The refresh buttons, for the strip at the top of the abilities tab */
export const PCSheetRefreshButtons = memo(function PCSheetRefreshButtons() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const useMwStyleAbilities = useSettings((s) => s.useMwStyleAbilities);
  const methods = useSystemMethods(actor);

  return (
    <div
      className={css({
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5em",
        // as wide as their labels, not the whole strip (componentDefaults.css)
        "& > button": { width: "auto", whiteSpace: "nowrap" },
      })}
    >
      {useMwStyleAbilities && (
        <>
          <Button onClick={methods.confirmMw2Refresh}>
            <Translate>2h Refresh</Translate>
          </Button>
          <Button onClick={methods.confirmMw4Refresh}>
            <Translate>4h Refresh</Translate>
          </Button>
          <Button onClick={methods.confirmMw8Refresh}>
            <Translate>8h Refresh</Translate>
          </Button>
        </>
      )}
      <Button onClick={methods.confirmRefresh}>
        <Translate>Full Refresh</Translate>
      </Button>
      {useMwStyleAbilities || (
        <Button onClick={methods.confirm24hRefresh}>
          <Translate>24h Refresh</Translate>
        </Button>
      )}
    </div>
  );
});

/**
 * The pool trackers (and Moribund World's injury status). The stats and
 * initiative ability join them when there's no combat tab to hold them.
 */
export const PCSheetPools = memo(function PCSheetPools() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const pools = useActorSnapshot(actor, (snapshot) => ({
    mwInjuryStatus: snapshot.system.mwInjuryStatus,
  }));
  const { useMwInjuryStatus, noCombatTab } = useSettings((s) => ({
    useMwInjuryStatus: s.useMwInjuryStatus,
    // Moribund World's alternative item types have no weapons (PCSheetFull)
    noCombatTab: s.mwUseAlternativeItemTypes,
  }));
  const methods = useSystemMethods(actor);

  return (
    <Panel
      className={css({
        gridArea: "pools",
        position: "relative",
        overflowX: "visible",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
      })}
    >
      {useMwInjuryStatus && (
        <MwInjuryStatusWidget
          status={pools.mwInjuryStatus}
          setStatus={methods.setMwInjuryStatus}
        />
      )}
      <TrackersArea />
      {noCombatTab && <CombatStats inColumn />}
    </Panel>
  );
});
