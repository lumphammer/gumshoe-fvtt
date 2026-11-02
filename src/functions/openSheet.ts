import { assertApplicationV2 } from "./assertApplicationV2";

/** Open a document's sheet (bringing it to the front), if it has one */
export function openSheet(doc: { sheet?: unknown } | null | undefined): void {
  const sheet = doc?.sheet;
  if (sheet === null || sheet === undefined) return;
  assertApplicationV2(sheet);
  void sheet.render({ force: true });
}
