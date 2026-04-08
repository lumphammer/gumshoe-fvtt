import { memoizeNullaryOnce } from "./utilities";

const TextEditor = window.foundry?.applications?.ux?.TextEditor?.implementation;

// /////////////////////////////////////////////////////////////////////////////
// Toolbox
// /////////////////////////////////////////////////////////////////////////////

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
    onTagAttr: function (tag, name, value) {
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
    const enrichedHtml = await TextEditor.enrichHTML(originalHtml, {
      // we will always include secrets in the output; the other way is to run
      // this at render time and conditionally include secrets based on
      // permission levels, but we handle that with styles
      secrets: true,
    });
    // v13 wraps secrets in a secret-block element. We need to unwrap them
    // because for whatever reason (maybe because we're not using prosemirror
    // yet?) they don't work to hide/reveal stuff for us and we already have
    // our own machinery for doing that
    const tmpDiv = document.createElement("div");
    tmpDiv.innerHTML = enrichedHtml;
    tmpDiv.querySelectorAll("secret-block").forEach((secret) => {
      secret.replaceWith(...Array.from(secret.childNodes));
    });
    return tmpDiv.innerHTML;
  } else {
    return originalHtml;
  }
}

export const cleanHtml = async (originalHtml: string) => {
  const xss = await createXss();
  const cleanedHtml = xss.process(originalHtml);
  return cleanedHtml;
};

export const cleanAndEnrichHtml = async (originalHtml: string) => {
  const enrichedHtml = await enrichHtml(originalHtml);
  const xssedHtml = await cleanHtml(enrichedHtml);
  return xssedHtml;
};
