import { useState } from "react";

import { usageStatsConfig } from "../../../startup/installUsageStats";
import {
  getUsageStatsState,
  resetInstallId,
  sendUsageStatsIfDue,
  setSharing,
} from "../../../usageStats/usageStats";
import {
  formatReport,
  usageStatsInfoUrl,
} from "../../../usageStats/usageStatsDialog";
import { Button } from "../../inputs/Button";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { SettingsGridField } from "../SettingsGridField";
import { SettingsNote } from "../SettingsNote";

/**
 * Whether this world shares anonymous usage stats. These take effect straight
 * away, rather than with the rest of the settings when you save.
 */
export const UsageStatsSettings = () => {
  const [state, setState] = useState(() =>
    getUsageStatsState(usageStatsConfig),
  );
  const refresh = () => setState(getUsageStatsState(usageStatsConfig));
  const sharing = state.consent === "yes";

  const handleShare = async (share: boolean) => {
    await setSharing(usageStatsConfig, {
      share,
      shareModules: share && state.shareModules,
    });
    refresh();
    if (share) {
      // send today's report now, rather than on the next load
      await sendUsageStatsIfDue(usageStatsConfig);
      refresh();
    }
  };
  const handleShareModules = async (shareModules: boolean) => {
    await setSharing(usageStatsConfig, { share: true, shareModules });
    refresh();
  };
  const handleReset = async () => {
    await resetInstallId(usageStatsConfig);
    refresh();
  };

  return (
    <>
      <SettingsNote>
        <Translate>UsageStatsSettingsNote</Translate>
      </SettingsNote>
      <InputGrid>
        <SettingsGridField label="Share anonymous usage stats">
          <Toggle checked={sharing} onChange={handleShare} />
        </SettingsGridField>
        {sharing && (
          <SettingsGridField label="Also share the list of active modules">
            <Toggle
              checked={state.shareModules}
              onChange={handleShareModules}
            />
          </SettingsGridField>
        )}
        {sharing && (
          <SettingsGridField label="Last sent">
            {state.lastSentDay || <Translate>Not yet</Translate>}
          </SettingsGridField>
        )}
        {sharing && (
          <SettingsGridField label="Install ID">
            <div css={{ display: "flex", gap: "0.5em", alignItems: "center" }}>
              <code>{state.installId}</code>
              <Button onClick={handleReset}>
                <Translate>Reset</Translate>
              </Button>
            </div>
          </SettingsGridField>
        )}
        <SettingsGridField label="What would be sent">
          <details>
            <summary>
              <Translate>UsageStatsShowReport</Translate>
            </summary>
            <pre
              css={{
                maxHeight: "20em",
                overflow: "auto",
                userSelect: "text",
              }}
            >
              {formatReport(usageStatsConfig, sharing && state.shareModules)}
            </pre>
          </details>
          <a href={usageStatsInfoUrl} target="_blank" rel="noopener noreferrer">
            <Translate>UsageStatsHowItWorks</Translate>
          </a>
        </SettingsGridField>
      </InputGrid>
    </>
  );
};

UsageStatsSettings.displayName = "UsageStatsSettings";
