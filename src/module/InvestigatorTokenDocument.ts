/**
 * There's some foundrytude about resource attributes that aren't defined in
 * template.json. Now we're allowing abilities to define arbitrary resource ids
 * to sync with, we can't guarantee to define them all in template.json, but
 * when they're not there, they can't be edited through the token HUD.
 *
 * This override seems to be the fix.
 *
 * See https://discord.com/channels/732325252788387980/824055460386177064/1137110380573900901
 */
export class InvestigatorTokenDocument extends TokenDocument {
  getBarAttribute(barName: string, options: any = {}) {
    const result = super.getBarAttribute(barName, options);
    if (result && !result.editable) {
      result.editable = true;
    }
    return result;
  }
}
