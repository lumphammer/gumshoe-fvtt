// Foundry glue for Network contacts (Fall of DELTA GREEN, p. 068). The rules
// are in `rules.ts`.

import * as constants from "../../constants";
import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { getTranslated } from "../../functions/getTranslated";
import { settings } from "../../settings/settings";
import { isPCActor } from "../actors/pc";
import type { NetworkContactItem } from "../items/networkContact";
import type { ContactRecord } from "./rules";
import { getMaxAssignablePoints, serializeContactRecord } from "./rules";

const isWholeNumber = (n: number) => Number.isInteger(n) && n > 0;

/** The card's content: the record, with nothing to look up later */
const buildContactCard = (contact: NetworkContactItem, record: ContactRecord) =>
  buildAbilityCardContent({
    [constants.htmlDataMode]: constants.htmlDataModeNetworkContact,
    [constants.htmlDataActorId]: contact.actor?.id,
    [constants.htmlDataImageUrl]: contact.img,
    [constants.htmlDataNetworkContact]: serializeContactRecord(record),
  });

const getSpeaker = (contact: NetworkContactItem) =>
  ChatMessage.getSpeaker({ actor: contact.actor as Actor.Stored });

/**
 * Give a contact points from the owner's Network pool: when they're revealed,
 * or later (another favour owed, or the contact's twin in the same town).
 */
export async function assignNetworkPoints(
  contact: NetworkContactItem,
  points: number,
): Promise<void> {
  const actor = contact.actor;
  const network = isPCActor(actor)
    ? actor.system.getNetworkAbility()
    : undefined;
  // the sheet only offers what's allowed, but it may be out of date
  if (
    !isPCActor(actor) ||
    network === undefined ||
    !isWholeNumber(points) ||
    points > getMaxAssignablePoints(network.system.pool)
  ) {
    ui.notifications?.warn(
      getTranslated("CantAssignThatManyNetworkPoints", {
        AbilityName: settings.networkAbility.get(),
      }),
    );
    return;
  }
  const networkBefore = network.system.pool;
  const poolBefore = contact.system.pool;
  await actor.updateEmbeddedDocuments("Item", [
    { _id: network.id, system: { pool: networkBefore - points } },
    { _id: contact.id, system: { pool: poolBefore + points } },
  ]);
  await ChatMessage.create({
    speaker: getSpeaker(contact),
    content: buildContactCard(contact, {
      kind: "assign",
      contactName: contact.name ?? "",
      location: contact.system.location,
      points,
      die: null,
      total: null,
      poolBefore,
      poolAfter: poolBefore + points,
      networkName: network.name ?? "",
      networkBefore,
      networkAfter: networkBefore - points,
    }),
  });
}

/**
 * The contact acts on the PC's behalf: a test of their own pool. The
 * Difficulty is the GM's, depending on the local jurisdiction.
 */
export async function testContact(
  contact: NetworkContactItem,
  spend: number,
): Promise<void> {
  const poolBefore = contact.system.pool;
  if (!Number.isInteger(spend) || spend < 0 || spend > poolBefore) {
    ui.notifications?.warn(
      getTranslated("ContactCantSpareThatMany", {
        ContactName: contact.name ?? "",
      }),
    );
    return;
  }
  const roll = new Roll("1d6 + @spend", { spend });
  await roll.evaluate();
  const die = roll.dice[0]?.total ?? 0;
  await contact.update({ system: { pool: poolBefore - spend } });
  await roll.toMessage({
    speaker: getSpeaker(contact),
    content: buildContactCard(contact, {
      kind: "test",
      contactName: contact.name ?? "",
      location: contact.system.location,
      points: spend,
      die,
      total: roll.total ?? die + spend,
      poolBefore,
      poolAfter: poolBefore - spend,
      networkName: null,
      networkBefore: null,
      networkAfter: null,
    }),
  });
}

/**
 * Tap the contact for information: 1 point, or 2 for a mother lode. (Core
 * clues are free, so there's nothing to click for them.)
 */
export async function tapContact(
  contact: NetworkContactItem,
  cost: number,
): Promise<void> {
  const poolBefore = contact.system.pool;
  if (!isWholeNumber(cost) || cost > poolBefore) {
    ui.notifications?.warn(
      getTranslated("ContactCantSpareThatMany", {
        ContactName: contact.name ?? "",
      }),
    );
    return;
  }
  await contact.update({ system: { pool: poolBefore - cost } });
  await ChatMessage.create({
    speaker: getSpeaker(contact),
    content: buildContactCard(contact, {
      kind: "info",
      contactName: contact.name ?? "",
      location: contact.system.location,
      points: cost,
      die: null,
      total: null,
      poolBefore,
      poolAfter: poolBefore - cost,
      networkName: null,
      networkBefore: null,
      networkAfter: null,
    }),
  });
}
