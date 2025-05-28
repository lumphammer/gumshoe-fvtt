import { describe, expect, test } from "vitest";

import { NoteFormat } from "../types";
import { convertNotes, toHtml } from "./textFunctions";

const markdownSample = `# This is a title

This is a paragraph. The next thing is a dangerous script tag:

## This is a subtitle

This is another paragraph. It has a [link](https://example.com) in it. It's quite long
and has a line break in it.

<script>alert("hello")</script>

This is a list:

- item 1
- item 2
- item 3
`;

describe("toHtml", async () => {
  const html = await toHtml("markdown", markdownSample);
  test("converts plain text to html", async () => {
    const result = await toHtml("plain", markdownSample);
    expect(result).toMatchSnapshot();
  });
  test("converts markdown to html", () => {
    expect(html).toMatchSnapshot();
  });
  test("converts rich text to html", async () => {
    const result = await toHtml("richText", html);
    expect(result).toMatchSnapshot();
  });
});

describe("convertNotes", async () => {
  const html = await toHtml("markdown", markdownSample);

  test.each<[NoteFormat, NoteFormat, string, string]>([
    ["plain", "plain", markdownSample, markdownSample],
    ["plain", "markdown", markdownSample, markdownSample],
    ["markdown", "plain", markdownSample, markdownSample],
    ["markdown", "markdown", markdownSample, markdownSample],
    ["richText", "richText", html, html],
  ])("converts %s to %s", async (oldFormat, newFormat, input, expected) => {
    const { newSource: result } = await convertNotes(
      oldFormat,
      newFormat,
      input,
    );
    expect(result).toBe(expected);
  });
  test.each<[NoteFormat, NoteFormat, string]>([
    ["plain", "richText", markdownSample],
    ["markdown", "richText", markdownSample],
    ["richText", "plain", html],
    ["richText", "markdown", html],
  ])("converts %s to %s", async (oldFormat, newFormat, input) => {
    const result = await convertNotes(oldFormat, newFormat, input);
    expect(result).toMatchSnapshot();
  });
});
