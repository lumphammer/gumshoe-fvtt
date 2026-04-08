const hasProperty = foundry.utils.hasProperty;
const getProperty = foundry.utils.getProperty;
const setProperty = foundry.utils.setProperty;

/**
 * A similar function to fvtt's own _addDataFieldMigration, but allows for
 * just transforming a value in-place.
 * @param data The data to operate on (e.g. the source data in a `static migrateData(source) {...}`)
 * @param key The key to operate on. This can be a nested path like `stats.str`
 * @param transform A function which will be passed the value at `key` within `data`
 *  and should return the transformed value. THIS MUST BE IDEMPOTENT!
 * @returns True if a migration occurred, otherwise false.
 */
export function migrateValue(
  data: any,
  key: string,
  transform: (old: any) => any,
) {
  if (!hasProperty(data, key)) {
    return;
  }
  let target = data;
  let targetKey = key;
  if (targetKey.includes(".")) {
    const parts = targetKey.split(".");
    target = getProperty(data, parts.slice(0, -1).join(".")) as any;
    targetKey = parts.at(-1) as string;
  }
  const targetValue = target[targetKey];
  const descriptor = Object.getOwnPropertyDescriptor(target, targetKey);
  if (descriptor && !descriptor.writable) {
    return;
  }
  setProperty(target, targetKey, transform(targetValue));
}
