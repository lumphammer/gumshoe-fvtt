import { weapon } from "../../../constants";
import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertActiveCharacterActor } from "../../../module/actors/types";
import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";
import { WeaponRowEdit } from "./WeaponRowEdit";

export const WeaponsAreaEdit = () => {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const items = actor.system.getWeapons();
  return (
    <div>
      <div
        css={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <h1
          css={{
            flex: 1,
          }}
        >
          <Translate>Weapons</Translate>
        </h1>
        <Button
          css={{
            float: "right",
            width: "auto",
          }}
          onClick={async () => {
            await actor.createEmbeddedDocuments("Item", [
              {
                type: weapon,
                name: "A new weapon",
                system: {
                  notes: {
                    format: "plain",
                  },
                },
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
            gridTemplateColumns: "10em repeat(5, 1fr) 2em 2em",
            gridTemplateAreas:
              '"name base  pb    cr    nr    lr    back  delete" ' +
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
              gridColumn: "base / span 6",
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

          {sortEntitiesByName(items).map((item, index) => (
            <WeaponRowEdit key={item.id} weapon={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};
