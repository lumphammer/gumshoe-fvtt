import type { CrisisCall } from "../../module/bonds/crisis";
import * as constants from "../../constants";
import { useSnapshotSelector } from "../../hooks/useSnapshot";
import { isPCActor } from "../../module/actors/pc";
import { canUser } from "../../module/permissions";
import { getWorldActorsStore } from "../../module/snapshots/documentStores";
import { openTeamCrisisWindow } from "../../module/bonds/TeamCrisisApp";
import { NativeButton } from "../native/NativeButton";
import { Translate } from "../Translate";

type CrisisCallCardProps = {
  call: CrisisCall;
  imageUrl: string | null;
};

/**
 * A GM's call for a team crisis (Fall of DELTA GREEN, p. 046): who was
 * there, and for each Agent you own, a button to make your test. The others
 * present are ticked as teammates.
 */
export const CrisisCallCard = ({ call, imageUrl }: CrisisCallCardProps) => {
  const uuids = call.members.map((member) => member.uuid);
  // which members this user can test for: Agents they own. (The world's
  // actors' snapshot changes when one is updated, its ownership included, and
  // the selector reads the live actor each time.)
  const canTest = useSnapshotSelector(getWorldActorsStore(), (actors) =>
    call.members.map((member) => {
      const entry = actors.find((actor) => actor.uuid === member.uuid);
      if (entry?.type !== constants.pc) return false;
      const actor = fromUuidSync(member.uuid);
      return isPCActor(actor) && canUser(actor, "OWNER");
    }),
  );
  return (
    <div
      data-testid="crisis-call-card"
      css={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        gridTemplateAreas: '"image headline" "image body"',
        alignItems: "center",
      }}
    >
      <div
        css={{
          height: "4em",
          width: "4em",
          gridArea: "image",
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          transform: "scale(0.9) rotate(-5deg)",
          boxShadow: "0 0 0.5em black",
          marginRight: "1em",
          alignSelf: "start",
        }}
      />
      <b css={{ gridArea: "headline" }}>
        <Translate>Team Crisis</Translate>
      </b>
      <div css={{ gridArea: "body" }}>
        <p>
          <Translate>CrisisCallHint</Translate>
        </p>
        {call.members.map((member, i) => {
          // only Agents have Bonds, and only their owners can test
          return (
            <div
              key={member.uuid}
              data-testid="crisis-call-member"
              css={{
                display: "flex",
                alignItems: "center",
                gap: "0.5em",
                marginBottom: "0.25em",
              }}
            >
              <span css={{ flex: 1 }}>{member.name}</span>
              {canTest[i] && (
                <NativeButton
                  css={{ width: "auto", margin: 0 }}
                  onClick={() => {
                    const actor = fromUuidSync(member.uuid);
                    if (!isPCActor(actor)) return;
                    void openTeamCrisisWindow(
                      actor,
                      uuids.filter((uuid) => uuid !== member.uuid),
                    );
                  }}
                >
                  <Translate>Make the test</Translate>{" "}
                  <i className="fa fa-dice" />
                </NativeButton>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

CrisisCallCard.displayName = "CrisisCallCard";
