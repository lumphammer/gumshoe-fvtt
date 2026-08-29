export function notifyJournalSaveError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  ui.notifications?.error(`Could not save journal page: ${message}`);
}
