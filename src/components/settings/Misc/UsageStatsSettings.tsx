import { useState } from "react";

import { usageStatsConfig } from "../../../startup/installUsageStats";
import {
  getUsageStatsState,
  resetInstallId,
  sendUsageStatsIfDue,
  setSharing,
} from "../../../usageStats/usageStats";
import { formatReport } from "../../../usageStats/usageStatsDialog";
import { Button } from "../../inputs/Button";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { SettingsGridField, SettingsGridFieldStacked } from "../SettingsGridField";
import { SettingsNote } from "../SettingsNote";

/**
 * Whether this world shares anonymous usage stats. These take effect straight
 * away, rather than with the rest of the settings when you save.
 */
export const UsageStatsSettings = () => {
  const [state, setState] = useState(() => getUsageStatsState(usageStatsConfig));
  const refresh = () => setState(getUsageStatsState(usageStatsConfig));
  const sharing = state.consent === "yes";

  const handleShare = async (share: boolean) => {
    await setSharing(usageStatsConfig, share);
    refresh();
    if (share) {
      // send today's report now, rather than on the next load
      await sendUsageStatsIfDue(usageStatsConfig);
      refresh();
    }
  };
  const handleReset = async () => {
    await resetInstallId(usageStatsConfig);
    refresh();
  };

  return (
    <>
      <SettingsNote mode="info">
        <Translate rich block>
          UsageStatsOffer
        </Translate>
      </SettingsNote>
      <InputGrid>
        <SettingsGridField label="Share anonymous usage stats">
          <Toggle checked={sharing} onChange={handleShare} />
        </SettingsGridField>
        {sharing && (
          <SettingsGridField label="Last sent">
            {state.lastSentDay || <Translate>Not yet</Translate>}
          </SettingsGridField>
        )}
        {state.installId && (
          <SettingsGridField label="Install ID">
            <div css={{ display: "flex", gap: "0.5em", alignItems: "center" }}>
              <code>{state.installId}</code>
              <Button onClick={handleReset}>
                <Translate>Reset</Translate>
              </Button>
            </div>
          </SettingsGridField>
        )}

        <SettingsGridFieldStacked>
          <details css={{ cursor: "pointer" }}>
            <summary>
              <Translate>UsageStatsShowReport</Translate>
            </summary>
            <pre
              css={{
                // maxHeight: "20em",
                // overflow: "auto",
                userSelect: "text",
              }}
            >
              {formatReport(usageStatsConfig)}
            </pre>
          </details>
        </SettingsGridFieldStacked>
      </InputGrid>
    </>
  );
};

UsageStatsSettings.displayName = "UsageStatsSettings";
