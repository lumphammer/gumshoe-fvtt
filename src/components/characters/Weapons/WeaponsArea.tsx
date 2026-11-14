import { memo, useCallback } from "react";

import { liveItems } from "../../../functions/liveItems";
import { isWeaponItem } from "../../../module/items/weapon";
import { openSheet } from "../../../functions/openSheet";
import { weapon } from "../../../constants";
import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSnapshot } from "../../../hooks/useActorSnapshot";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { useSystemMethods } from "../../../hooks/useSystemMethods";
import type { WeaponItem } from "../../../module/items/weapon";
import { assertActiveCharacterActor } from "../../../module/actors/types";
import { WeaponAttackPanel } from "../../equipment/WeaponAttackPanel";
import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";
import { WeaponRow } from "./WeaponRow";
import {
  panel,
  sectionHeading,
  tableHeader,
} from "../../../styled-system/recipes";
import { css, cx } from "../../../styled-system/css";

// the "&&" beats Foundry's own h2 margins
const headingStyle = { "&&": { margin: 0 } };

type WeaponsAreaProps = {
  /**
   * Take at least the height of the tab, with the ready weapon at the bottom
   * (when the weapons have a tab to themselves)
   */
  fillHeight?: boolean;
};

/**
 * The character's weapons, and the ready one's attack panel. Reads the actor
 * through a snapshot, selecting only which weapons there are and which is
 * ready: each row reads its own weapon, and the panel is an island.
 */
export const WeaponsArea = memo(function WeaponsArea({
  fillHeight = false,
}: WeaponsAreaProps) {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const { ids, readyId, readyName } = useActorSnapshot(actor, (snapshot) => {
    const weapons = snapshot.items.filter((item) => item.type === weapon);
    const readyWeaponId = snapshot.system.readyWeaponId;
    const ready = weapons.find((item) => item._id === readyWeaponId);
    return {
      ids: sortEntitiesByName(weapons).map((item) => item._id ?? ""),
      readyId: ready?._id ?? null,
      readyName: ready?.name ?? "",
    };
  });
  // the live weapons, only to pass to the rows and the panel
  const items = liveItems(actor, ids, isWeaponItem);
  const readyWeapon = items.find((item) => item.id === readyId);
  const { setReadyWeapon } = useSystemMethods(actor);
  // only one weapon is ready at a time
  const setReady = useCallback(
    (item: WeaponItem, ready: boolean) =>
      void setReadyWeapon(ready ? item : null),
    [setReadyWeapon],
  );
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
      })}
      style={{ height: fillHeight ? "100%" : undefined }}
    >
      {/* the list gets whatever the ready weapon leaves, scrolling if need be */}
      <div
        className={css(
          fillHeight ? { flex: "[1]", minHeight: 0, overflow: "auto" } : {},
        )}
      >
        <div
          className={css({
            display: "flex",
            flexDirection: "row",
          })}
        >
          <h2 className={css({ flex: "[1]", ...headingStyle })}>
            <Translate>Weapons</Translate>
          </h2>
          <Button
            className={css({
              flexBasis: "max-content",
              alignSelf: "flex-start",
            })}
            onClick={async () => {
              await actor.createEmbeddedDocuments(
                "Item",
                [
                  {
                    type: weapon,
                    name: "New weapon",
                  },
                ],
                {
                  renderSheet: true,
                },
              );
            }}
          >
            <i className="fa fa-plus" />
            <Translate>Add Weapon</Translate>
          </Button>
        </div>

        {items.length === 0 && (
          <i
            className={css({
              display: "block",
              fontSize: "1.2em",
            })}
          >
            <Translate>No weapons yet!</Translate>
          </i>
        )}
        {items.length > 0 && (
          <div
            className={css({
              display: "grid",
              // ready, name, ammo, ability, delete
              gridTemplateColumns:
                "max-content 1fr max-content 1fr max-content",
              gridAutoRows: "min-content",
              columnGap: "0.5em",
              whiteSpace: "nowrap",
            })}
          >
            {/* the header row, underlined like the ability categories */}
            <div
              className={cx(
                tableHeader(),
                css({
                  gridColumn: "1/-1",
                  display: "grid",
                  gridTemplateColumns: "subgrid",
                  "& > *": { paddingInline: "0.25em" },
                }),
              )}
            >
              <div>
                <Translate>Ready</Translate>?
              </div>
              <div>
                <Translate>Name</Translate>
              </div>
              <div className={css({ textAlign: "center" })}>
                <Translate>Ammo</Translate>
              </div>
              <div>
                <Translate>Ability</Translate>
              </div>
            </div>
            {items.map((item) => (
              <WeaponRow
                key={item.id}
                weapon={item}
                isReady={item === readyWeapon}
                setReady={setReady}
              />
            ))}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div
          className={css(
            { paddingTop: "1em", display: "flex", flexDirection: "column" },
            // half the tab, growing to three quarters to fit the panel in
            fillHeight && readyWeapon
              ? { minHeight: "50%", maxHeight: "75%" }
              : {},
          )}
        >
          {readyWeapon ? (
            <div className={panel()}>
              <div
                className={cx(
                  sectionHeading(),
                  css({
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                    marginBottom: "0.5em",
                  }),
                )}
              >
                <h2 className={css({ flex: "[1]", ...headingStyle })}>
                  {readyName}
                </h2>
                <Button
                  className={css({
                    flexBasis: "max-content",
                    marginBottom: "0.2em",
                  })}
                  onClick={() => {
                    openSheet(readyWeapon);
                  }}
                >
                  <i className="fa fa-edit" />
                  <Translate>Edit</Translate>
                </Button>
              </div>
              <div className={css({ minHeight: 0, overflow: "auto" })}>
                {/* a fresh panel for each weapon, so spends etc. don't carry
                    over */}
                <WeaponAttackPanel key={readyWeapon.id} weapon={readyWeapon} />
              </div>
            </div>
          ) : (
            <i>
              <Translate>Ready a weapon to attack with it</Translate>
            </i>
          )}
        </div>
      )}
    </div>
  );
});
