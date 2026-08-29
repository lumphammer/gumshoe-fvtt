import { journalMemory, systemId } from "../../constants";
import { createSerializedUpdateQueue } from "../../functions/createSerializedUpdateQueue";
import { createDocumentMemory } from "./documentMemory/createDocumentMemory";
import { dehydrate } from "./documentMemory/dehydrate";
import { rehydrate } from "./documentMemory/rehydrate";
import { save } from "./documentMemory/save";
import { DocumentMemory } from "./documentMemory/types";
import { getMemoryId } from "./getMemoryId";
import { getStoredDocumentMemory } from "./getStoredDocumentMemory";

// this is definitely tuneable. my initial thought was something like 100, while
// that gives great recent fidelity, you're suddenly losing huge chunks of
// deltas after that. 10 seems fair for now.
const MEMORY_PERIOD = 10;
const serializePageSave = createSerializedUpdateQueue<string>();

/**
 * Save a JournalEntryPage's content and revision memory in one embedded-document
 * update, and return the updated memory. Saves to the same page are serialized.
 */
export async function savePage(
  page: any,
  content: string,
  memory: DocumentMemory | undefined,
): Promise<DocumentMemory> {
  const memoryId = getMemoryId(page);
  return serializePageSave(memoryId, async () => {
    const storedMemory = getStoredDocumentMemory(page);
    if (storedMemory && (!memory || storedMemory.serial >= memory.serial)) {
      memory = rehydrate(storedMemory);
    }
    memory ??= createDocumentMemory(MEMORY_PERIOD);
    memory = save(memory, content);

    await page.parent.updateEmbeddedDocuments("JournalEntryPage", [
      {
        _id: page.id,
        text: { content },
        flags: {
          [systemId]: {
            [journalMemory]: dehydrate(memory),
          },
        },
      },
    ]);
    return memory;
  });
}
