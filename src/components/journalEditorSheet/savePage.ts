import { settings } from "../../settings/settings";
import { createDocumentMemory } from "./documentMemory/createDocumentMemory";
import { dehydrate } from "./documentMemory/dehydrate";
import { rehydrate } from "./documentMemory/rehydrate";
import { save } from "./documentMemory/save";
import { DocumentMemory } from "./documentMemory/types";
import { getMemoryId } from "./getMemoryId";

const MEMORY_PERIOD = 10;

export async function savePage(
  page: any,
  content: string,
  memory: DocumentMemory | undefined,
): Promise<DocumentMemory> {
  // get or create the memory object
  const memoryId = getMemoryId(page);
  // ensure memory exists, by restoring it or creating a new one if needed
  if (memory === undefined) {
    const bareMemory = settings.journalMemories.get()?.[memoryId];
    memory = bareMemory
      ? rehydrate(bareMemory)
      : createDocumentMemory(MEMORY_PERIOD);
  }
  // save the foundry document
  await page.parent.updateEmbeddedDocuments("JournalEntryPage", [
    {
      _id: page.id,
      text: { content },
    },
  ]);
  // update the memory
  memory = save(memory, content);
  // save the memory to the world (settings)
  const journalMemoryCollection = {
    ...settings.journalMemories.get(),
    [memoryId]: dehydrate(memory),
  };
  settings.journalMemories.set(journalMemoryCollection);
  return memory;
}