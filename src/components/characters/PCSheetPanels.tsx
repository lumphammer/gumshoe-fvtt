import { memo, useCallback, useRef } from "react";

import * as c from "../../constants";
import { occupationSlotIndex } from "../../constants";
import { openSheet } from "../../functions/openSheet";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useIsEditable } from "../../hooks/useIsEditable";
import { useIsGM } from "../../hooks/useIsGM";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertPCActor } from "../../module/actors/pc";
import { ImagePickle } from "../ImagePickle";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { IndexedAsyncTextInput } from "../inputs/IndexedAsyncTextInput";
import { InputGrid } from "../inputs/InputGrid";
import { Translate } from "../Translate";
import { getTranslated } from "../../functions/getTranslated";
import { LogoEditable, type LogoSubTextPart } from "./LogoEditable";
import { MwInjuryStatusWidget } from "./MoribundWorld/MwInjuryStatusWidget";
import { PersonalDetailField } from "./PersonalDetailField";
import { CombatStats } from "./Weapons/CombatStats";
import { HeaderStats, useHeaderStatIds } from "./HeaderStats";
import { TrackersArea } from "./TrackersArea";
import { Region } from "../Region";
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

/**
 * The name and occupation, and the portrait. The occupation is a button,
 * which opens its sheet, and can be dragged to another (or makes one, if
 * there's none and the sheet can be edited): the stats panel has no field for
 * it. With several (a detail moved into the occupation slot), each is a
 * button of its own.
 */
export const PCSheetHeader = memo(function PCSheetHeader() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const header = useActorSnapshot(actor, (snapshot) => ({
    name: snapshot.name,
    img: snapshot.img,
  }));
  const { genericOccupation, occupationLabel } = useSettings((s) => ({
    genericOccupation: s.genericOccupation,
    occupationLabel: s.occupationLabel,
  }));
  const isEditable = useIsEditable();
  const occupations = usePersonalDetails().filter(
    (item) => item.slotIndex === occupationSlotIndex,
  );
  // never an empty button: the slot's name, if even the generic one is blank
  const fallback = genericOccupation || occupationLabel;
  const labelled = (text: string) =>
    getTranslated("LabelAndValue", { Label: occupationLabel, Value: text });
  // a second click while the first is still making one doesn't make another
  const creating = useRef(false);
  const createOccupation = () => {
    if (creating.current || actor.system.getOccupations().length > 0) {
      return;
    }
    creating.current = true;
    void actor.system.createPersonalDetail(occupationSlotIndex).finally(() => {
      creating.current = false;
    });
  };
  const occupationParts: LogoSubTextPart[] =
    occupations.length > 0
      ? occupations.map(({ id, name }) => {
          const text = name || fallback;
          return {
            key: id,
            text,
            label: labelled(text),
            itemId: id,
            // the live item, only when it's clicked
            onClick: () => openSheet(actor.items.get(id)),
          };
        })
      : [
          {
            key: "none",
            text: fallback,
            label: labelled(fallback),
            onClick: isEditable ? createOccupation : undefined,
          },
        ];

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
          subText={occupationParts}
          onChangeMainText={actor.setName}
        />
      </div>
      <ImagePickle
        img={header.img}
        className={css({
          gridArea: "image",
          // at the top of the root, under the titlebar's strip in the
          // full-frame layout, past its padding
          "--inv-image-pickle-clearance":
            "max(0px, calc(var(--inv-titlebar-clearance) - 0.5em))",
        })}
      />
    </>
  );
});

/**
 * Personal details, short notes and stats (the name and occupation are the
 * title's, in the header). Nothing at all when there are none of them, rather
 * than an empty region.
 */
export const PCSheetStats = memo(function PCSheetStats() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const stats = useActorSnapshot(actor, (snapshot) => ({
    shortNotes: snapshot.system.shortNotes,
    hiddenShortNotes: snapshot.system.hiddenShortNotes,
  }));
  const { personalDetails, shortHiddenNotesNames } = useSettings((s) => ({
    personalDetails: s.personalDetails,
    shortHiddenNotesNames: s.mwHiddenShortNotes,
  }));
  const { setShortNote, setMwHiddenShortNote } = useSystemMethods(actor);
  const hasHeaderStats = useHeaderStatIds().length > 0;
  const isGM = useIsGM();

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

  const showHiddenNotes = isGM && shortHiddenNotesNames.length > 0;
  if (personalDetails.length === 0 && !showHiddenNotes && !hasHeaderStats) {
    return null;
  }

  return (
    <Region
      className={css({
        gridArea: "stats",
        position: "relative",
      })}
    >
      <InputGrid>
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
        {showHiddenNotes &&
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
      <HeaderStats />
    </Region>
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
 * The pool trackers (and Moribund World's injury status). The initiative
 * ability joins them when there's no combat tab to hold it.
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
    <Region
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
    </Region>
  );
});
