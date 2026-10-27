import { weapon } from "../../../constants";
import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertActiveCharacterActor } from "../../../module/actors/types";
import { settings } from "../../../settings/settings";
import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";
import { WeaponRowEdit } from "./WeaponRowEdit";

export const WeaponsAreaEdit = () => {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const items = actor.system.getWeapons();
  // an extra column for Extended range
  const useExtendedRange = settings.useExtendedRange.get();
  return (
    <div>
      <div
        css={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        {/* as in play mode (WeaponsArea) */}
        <h2 css={{ flex: 1, "&&": { margin: 0 } }}>
          <Translate>Weapons</Translate>
        </h2>
        <Button
          css={{
            flexBasis: "max-content",
            // not stretched to the heading's height
            alignSelf: "flex-start",
          }}
          onClick={async () => {
            await actor.createEmbeddedDocuments("Item", [
              {
                type: weapon,
                name: "A new weapon",
              },
            ]);
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
            gridTemplateColumns: useExtendedRange
              ? "10em repeat(6, 1fr) 2em 2em"
              : "10em repeat(5, 1fr) 2em 2em",
            gridTemplateAreas: useExtendedRange
              ? '"name base  pb    cr    nr    lr    er    back  delete" ' +
                '"ammo notes notes notes notes notes notes notes notes"'
              : '"name base  pb    cr    nr    lr    back  delete" ' +
                '"ammo notes notes notes notes notes notes notes"',
            gridAutoRows: "min-content",
            gap: "0.5em",
            whiteSpace: "nowrap",
            ".header": {
              fontWeight: "bold",
            },
          }}
        >
          <div
            className="header"
            css={{
              gridColumn: "name",
              alignSelf: "end",
              gridRow: 2,
              textAlign: "center",
            }}
          >
            <Translate>Item Name</Translate>
          </div>
          <div
            className="header"
            css={{
              gridColumn: useExtendedRange ? "base / span 7" : "base / span 6",
              alignSelf: "end",
              gridRow: 1,
              borderBottom: "1px solid currentColor",
              textAlign: "center",
            }}
          >
            <Translate>Damage</Translate>
          </div>

          <div
            css={{
              gridColumn: "base",
              gridRow: 2,
            }}
          >
            <Translate>Base </Translate>
          </div>

          <div
            css={{
              gridColumn: "pb",
              gridRow: 2,
            }}
          >
            <Translate>PB</Translate>
          </div>

          <div
            css={{
              gridColumn: "cr",
              gridRow: 2,
            }}
          >
            <Translate>CR</Translate>
          </div>

          <div
            css={{
              gridColumn: "nr",
              gridRow: 2,
            }}
          >
            <Translate>NR</Translate>
          </div>

          <div
            css={{
              gridColumn: "lr",
              gridRow: 2,
            }}
          >
            <Translate>LR</Translate>
          </div>

          {useExtendedRange && (
            <div
              css={{
                gridColumn: "er",
                gridRow: 2,
              }}
            >
              <Translate>ER</Translate>
            </div>
          )}

          {sortEntitiesByName(items).map((item, index) => (
            <WeaponRowEdit key={item.id} weapon={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};
