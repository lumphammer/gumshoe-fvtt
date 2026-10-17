/**
 * Points spent from Bonds on a test, as recorded on its chat card. Names are
 * stored rather than ids, so the card still reads correctly after a Bond is
 * renamed or deleted.
 */
export type BondSpendRecord = {
  name: string;
  spend: number;
};

export function serializeBondSpends(records: BondSpendRecord[]): string | null {
  const spent = records.filter(({ spend }) => spend > 0);
  return spent.length > 0 ? JSON.stringify(spent) : null;
}

/**
 * Read Bond spends back from a chat card attribute. Anything malformed is
 * dropped rather than thrown: chat messages can't be fixed after the fact.
 */
export function parseBondSpends(text: string | null): BondSpendRecord[] {
  if (!text) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.flatMap((record: unknown) => {
    if (
      typeof record === "object" &&
      record !== null &&
      "name" in record &&
      "spend" in record &&
      typeof record.name === "string" &&
      typeof record.spend === "number" &&
      record.spend > 0
    ) {
      return [{ name: record.name, spend: record.spend }];
    }
    return [];
  });
}
