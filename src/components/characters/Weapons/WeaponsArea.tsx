import { useContext } from "react";

import { weapon } from "../../../constants";
import { assertApplicationV2 } from "../../../functions/assertApplicationV2";
import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertActiveCharacterActor } from "../../../module/actors/types";
import { ThemeContext } from "../../../themes/ThemeContext";
import { WeaponAttackPanel } from "../../equipment/WeaponAttackPanel";
import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";
import { WeaponRow } from "./WeaponRow";

// the "&&" beats Foundry's own h2 margins
const headingStyle = { "&&": { margin: 0 } };

type WeaponsAreaProps = {
  /**
   * Take at least the height of the tab, with the ready weapon at the bottom
   * (when the weapons have a tab to themselves)
   */
  fillHeight?: boolean;
};

export const WeaponsArea = ({ fillHeight = false }: WeaponsAreaProps) => {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const theme = useContext(ThemeContext);
  const items = actor.system.getWeapons();
  const readyWeapon = actor.system.getReadyWeapon();
  return (
    <div
      css={{
        height: fillHeight ? "100%" : undefined,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* the list gets whatever the ready weapon leaves, scrolling if need be */}
      <div
        css={
          fillHeight ? { flex: 1, minHeight: 0, overflow: "auto" } : undefined
        }
      >
        <div
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <h2 css={{ flex: 1, ...headingStyle }}>
            <Translate>Weapons</Translate>
          </h2>
          <Button
            css={{
              flexBasis: "max-content",
              alignSelf: "flex-start",
            }}
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
            css={{
              display: "block",
              fontSize: "1.2em",
            }}
          >
            <Translate>No weapons yet!</Translate>
          </i>
        )}
        {items.length > 0 && (
          <div
            css={{
              display: "grid",
              // ready, name, ammo, ability, delete
              gridTemplateColumns:
                "max-content 1fr max-content 1fr max-content",
              gridAutoRows: "min-content",
              columnGap: "0.5em",
              whiteSpace: "nowrap",
            }}
          >
            {/* the header row, underlined like the ability categories */}
            <div
              css={{
                gridColumn: "1/-1",
                display: "grid",
                gridTemplateColumns: "subgrid",
                fontWeight: "bold",
                borderBottom: `1px solid ${theme.colors.text}`,
                "& > *": { paddingInline: "0.25em" },
              }}
            >
              <div>
                <Translate>Ready</Translate>?
              </div>
              <div>
                <Translate>Name</Translate>
              </div>
              <div css={{ textAlign: "center" }}>
                <Translate>Ammo</Translate>
              </div>
              <div>
                <Translate>Ability</Translate>
              </div>
            </div>
            {sortEntitiesByName(items).map((item) => (
              <WeaponRow
                key={item.id}
                weapon={item}
                isReady={item === readyWeapon}
                // only one weapon is ready at a time
                setReady={(ready) =>
                  void actor.system.setReadyWeapon(ready ? item : null)
                }
              />
            ))}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div
          css={{
            paddingTop: "1em",
            display: "flex",
            flexDirection: "column",
            // half the tab, growing to three quarters to fit the panel in
            ...(fillHeight &&
              readyWeapon && { minHeight: "50%", maxHeight: "75%" }),
          }}
        >
          {readyWeapon ? (
            <>
              <div
                css={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-end",
                  marginBottom: "0.5em",
                  borderBottom: `1px solid ${theme.colors.text}`,
                }}
              >
                <h2 css={{ flex: 1, ...headingStyle }}>{readyWeapon.name}</h2>
                <Button
                  css={{ flexBasis: "max-content", marginBottom: "0.2em" }}
                  onClick={() => {
                    const sheet = readyWeapon.sheet;
                    assertApplicationV2(sheet);
                    void sheet.render({ force: true });
                  }}
                >
                  <i className="fa fa-edit" />
                  <Translate>Edit</Translate>
                </Button>
              </div>
              <div css={{ minHeight: 0, overflow: "auto" }}>
                {/* a fresh panel for each weapon, so spends etc. don't carry
                    over */}
                <WeaponAttackPanel key={readyWeapon.id} weapon={readyWeapon} />
              </div>
            </>
          ) : (
            <i>
              <Translate>Ready a weapon to attack with it</Translate>
            </i>
          )}
        </div>
      )}
    </div>
  );
};
