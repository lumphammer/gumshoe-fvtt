import type { CrisisCall } from "../../module/bonds/crisis";
import { isPCActor } from "../../module/actors/pc";
import { openTeamCrisisWindow } from "../../module/bonds/TeamCrisisApp";
import { Button } from "../inputs/Button";
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
        {call.members.map((member) => {
          const actor = fromUuidSync(member.uuid);
          // only Agents have Bonds, and only their owners can test
          const canTest = isPCActor(actor) && actor.isOwner;
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
              {canTest && (
                <Button
                  css={{ width: "auto", margin: 0 }}
                  onClick={() =>
                    openTeamCrisisWindow(
                      actor,
                      uuids.filter((uuid) => uuid !== member.uuid),
                    )
                  }
                >
                  <Translate>Make the test</Translate>{" "}
                  <i className="fa fa-dice" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

CrisisCallCard.displayName = "CrisisCallCard";
