import { weapon } from "../../../constants";
import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertActiveCharacterActor } from "../../../module/actors/types";
import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";
import { WeaponRow } from "./WeaponRow";

export const WeaponsArea = () => {
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
        <h2
          css={{
            flex: 1,
            "&&": {
              margin: "0 0 0 0",
            },
          }}
        >
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
            gridTemplateColumns: "1fr max-content max-content 1fr",
            gridAutoRows: "min-content",
            columnGap: "0.5em",
            whiteSpace: "nowrap",
            ".header": {
              fontWeight: "bold",
            },
          }}
        >
          <div className="header" css={{ gridColumn: 1 }}>
            <Translate>Weapon</Translate>
          </div>
          <div className="header" css={{ gridColumn: 2 }}>
            <Translate>Ammo</Translate>
          </div>
          <div className="header" css={{ gridColumn: 3 }}>
            <Translate>Damage</Translate>
          </div>
          {sortEntitiesByName(items).map((item) => (
            <WeaponRow key={item.id} weapon={item} />
          ))}
        </div>
      )}
    </div>
  );
};
