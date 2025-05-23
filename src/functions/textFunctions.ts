import { escape as escapeText } from "html-escaper";

import { NoteFormat } from "../types";
import { memoizeNullaryOnce } from "./utilities";

// /////////////////////////////////////////////////////////////////////////////
// Toolbox
// /////////////////////////////////////////////////////////////////////////////

// allow bundle splitting of turndown
const makeTurndown = memoizeNullaryOnce(async () => {
  const { default: TurndownService } = await import("turndown");
  class SafeTurndownService extends TurndownService {
    // by default, turndown escapes anything that looks like a markdown control
    // character (like `[` or `#`). I see the logic in this, but actually I feel
    // like for our purposes, if you have markdown-like html, you actually want to
    // have that seen as markdown after you convert? Also, it knackers foundry
    // link codes (which can be rectified, admittedly) and when we use turndown to
    // generate "plain text" we certainly don't want anything escaped.
    escape(text: string) {
      return text;
    }
  }
  // actual turndownservice object for later use
  const turndownService = new SafeTurndownService();
  return turndownService;
});

// allow bundle splitting of xss
const createXss = memoizeNullaryOnce(async () => {
  const {
    FilterXSS,
    whiteList: defaultXssWhitelist,
    escapeAttrValue,
  } = await import("xss");

  // build a custom shitelist for xss that adds "style" and "class" to the
  // allowed attributes for everything
  const newWhitelist = Object.fromEntries(
    Object.entries(defaultXssWhitelist).map(([tag, attrList = []]) => [
      tag,
      [...attrList, "style", "class"],
    ]),
  );

  // copilot said this but it does not work
  // newWhitelist["*"] = ["style"];

  // custom xss to allow style attributes and allow images with src attributes.
  // Yes, it's not ideal XSS, but then again this is a collaborative, trusted
  // environment.
  // see https://jsxss.com/en/examples/allow_attr_prefix.html
  const xss = new FilterXSS({
    whiteList: newWhitelist,
    onTagAttr: function (tag, name, value, isWhiteAttr) {
      const isImgSrc = tag === "img" && name === "src";
      const isDataAttr = name.startsWith("data-");
      if (isImgSrc || isDataAttr) {
        // escape its value using built-in escapeAttrValue function
        return name + '="' + escapeAttrValue(value) + '"';
      }
    },
  });
  return xss;
});

async function enrichHtml(originalHtml: string): Promise<string> {
  if (typeof TextEditor !== "undefined") {
    const newHtml = await TextEditor.enrichHTML(originalHtml, {
      // @ts-expect-error foundry types don't know about `async` yet
      async: true,
      // we will always include secrets in the output; the other way is to run
      // this at render time and conditionally include secrets based on
      // permission levels, but we handle that with styles
      secrets: true,
    });
    return newHtml;
  } else {
    return originalHtml;
  }
}

export const cleanAndEnrichHtml = async (originalHtml: string) => {
  const xss = await createXss();
  const enrichedHtml = await enrichHtml(originalHtml);
  const xssedHtml = xss.process(enrichedHtml);
  return xssedHtml;
};

// /////////////////////////////////////////////////////////////////////////////
// Converters
// There are no plaintext <=> markdown converters because it's a no-op.
// /////////////////////////////////////////////////////////////////////////////

async function htmlToMarkdown(html: string) {
  // ever first-time a cool regex and then realise you don't need it, but
  // you're so proud of your ninja regex skills dating back to doing Perl in the
  // 90s that you want to leave it in as a comment? Anyway check this bad boy
  // out. Turns out I don't need it because I've overridden turndown to stop it
  // doing any escaping at all.
  // return turndown(source).replace(/@(\w+)\\\[(\w+)\\\]\{([^}]*)\}/g, (m, p1, p2, p3) => `@${p1}[${p2}]{${p3}}`);
  const turndown = await makeTurndown();
  return turndown.turndown(html);
}

async function markdownToHtml(markdown: string) {
  const { marked } = await import("marked");
  return marked(markdown);
}

function plainTextToHtml(source: string) {
  return escapeText(source).replace(/\n/g, "<br/>");
}

function htmlToPlaintext(html: string) {
  return htmlToMarkdown(html);
}

/**
 * end-consumer function to convert a note to HTML.
 */
export async function toHtml(format: NoteFormat, source: string) {
  let rawHtml = "";
  if (format === "plain") {
    rawHtml = plainTextToHtml(source);
  } else if (format === "markdown") {
    rawHtml = await markdownToHtml(source);
  } else if (format === "richText") {
    rawHtml = source;
  }
  const html = await cleanAndEnrichHtml(rawHtml);
  return html;
}

/**
 * convert a note from one format to another
 */
export async function convertNotes(
  oldFormat: NoteFormat,
  newFormat: NoteFormat,
  oldSource: string,
) {
  let newSource = "";
  let rawHtml = "";
  if (newFormat === "plain") {
    if (oldFormat === "markdown" || oldFormat === "plain") {
      newSource = oldSource;
    } else if (oldFormat === "richText") {
      newSource = await htmlToPlaintext(oldSource);
    }
    rawHtml = plainTextToHtml(newSource);
  } else if (newFormat === "markdown") {
    if (oldFormat === "plain" || oldFormat === "markdown") {
      newSource = oldSource;
    } else if (oldFormat === "richText") {
      newSource = await htmlToMarkdown(oldSource);
    }
    rawHtml = await markdownToHtml(newSource);
  } else if (newFormat === "richText") {
    if (oldFormat === "plain") {
      newSource = plainTextToHtml(oldSource);
    } else if (oldFormat === "markdown") {
      newSource = await markdownToHtml(oldSource);
    } else if (oldFormat === "richText") {
      newSource = oldSource;
    }
    rawHtml = newSource;
  }
  const newHtml = await cleanAndEnrichHtml(rawHtml);
  return { newSource, newHtml };
}
