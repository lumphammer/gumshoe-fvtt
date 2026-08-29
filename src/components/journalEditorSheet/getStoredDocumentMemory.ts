import { journalMemory, systemId } from "../../constants";
import { settings } from "../../settings/settings";
import { BareDocumentMemory } from "./documentMemory/types";
import { getMemoryId } from "./getMemoryId";

export function getStoredDocumentMemory(
  page: any,
): BareDocumentMemory | undefined {
  const pageMemory = page.getFlag?.(systemId, journalMemory) as
    BareDocumentMemory | undefined;
  return pageMemory ?? settings.journalMemories.get()?.[getMemoryId(page)];
}
