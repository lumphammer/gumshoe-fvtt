import {
  previewReport,
  type OfferAnswer,
  type UsageStatsConfig,
} from "./usageStats";

/** Where the plan, and what's collected, are written up. */
export const usageStatsInfoUrl =
  "https://github.com/lumphammer/fvtt-telemetry/blob/main/docs/plan.md";

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  return el;
}

/** A paragraph of translated text, which may use some HTML (e.g. `<em>`). */
function paragraph(html: string) {
  const p = element("p");
  p.innerHTML = foundry.utils.cleanHTML(html);
  return p;
}

/** The JSON a report shows as, in the preview. */
export function formatReport(config: UsageStatsConfig) {
  return JSON.stringify(previewReport(config), null, 2);
}

/**
 * The explanation and the report preview, as HTML. The explanation may use
 * HTML (cleaned by Foundry); the preview is plain text, so it shows exactly
 * what would be sent.
 */
export function buildOfferContent(config: UsageStatsConfig) {
  const { localize } = config;
  const title = game.system?.id === config.packageId ? game.system.title : "";
  const values = { Package: title ?? config.packageId };
  const content = element("div");
  content.className = "usage-stats-offer";

  content.append(
    paragraph(localize("UsageStatsOffer", values)),
    paragraph(localize("UsageStatsPrivacy", values)),
  );

  const details = element("details");
  const pre = element("pre", formatReport(config));
  pre.style.maxHeight = "16em";
  pre.style.overflow = "auto";
  pre.style.userSelect = "text";
  details.append(element("summary", localize("UsageStatsShowReport")), pre);
  content.append(details);

  const link = element("a", localize("UsageStatsHowItWorks"));
  link.href = usageStatsInfoUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const more = element("p");
  more.append(link);
  content.append(more);

  return content.outerHTML;
}

/** Ask the GM. Closing the dialog counts as "ask me later". */
export async function askAboutUsageStats(
  config: UsageStatsConfig,
): Promise<OfferAnswer> {
  const { localize } = config;
  const result: unknown = await foundry.applications.api.DialogV2.wait({
    window: {
      title: localize("UsageStatsTitle"),
      icon: "fa-solid fa-chart-line",
    },
    position: { width: 540 },
    content: buildOfferContent(config),
    buttons: [
      {
        action: "later",
        label: localize("AskMeLater"),
        icon: "fa-solid fa-clock",
        // Enter shouldn't opt anyone in
        default: true,
      },
      { action: "no", label: localize("NoThanks"), icon: "fa-solid fa-ban" },
      {
        action: "yes",
        label: localize("ShareUsageStats"),
        icon: "fa-solid fa-check",
      },
    ],
  });
  return result === "yes" || result === "no" ? result : "later";
}
