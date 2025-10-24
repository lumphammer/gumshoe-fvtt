import { beforeAll, describe, expect, test } from "vitest";

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

const htmlSample = `<h1>This is a title</h1>

<p>This is a paragraph. The next thing is a dangerous script tag:</p>

<h2>This is a subtitle</h2>

<p>This is another paragraph. It has a <a href="https://example.com">link</a> in it. It's quite long
and has a line break in it.</p>

<script>alert("hello")</script>

<p>This is a list:</p>

<ul>
<li>item 1</li>
<li>item 2</li>
<li>item 3</li>
</ul>
`;

describe("toHtml", () => {
  let html: string;
  beforeAll(async () => {
    html = await toHtml("markdown", markdownSample);
  });
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

describe("convertNotes", () => {
  // test conversions that should be no-ops
  test.each<[NoteFormat, NoteFormat, string]>([
    ["plain", "plain", markdownSample],
    ["plain", "markdown", markdownSample],
    ["markdown", "plain", markdownSample],
    ["markdown", "markdown", markdownSample],
    ["richText", "richText", htmlSample],
  ])("converts %s to %s", async (oldFormat, newFormat, input) => {
    const { newSource: result } = await convertNotes(
      oldFormat,
      newFormat,
      input,
    );
    expect(result).toBe(input);
  });
  // test conversions that should change the source
  test.each<[NoteFormat, NoteFormat, string]>([
    ["plain", "richText", markdownSample],
    ["markdown", "richText", markdownSample],
    ["richText", "plain", htmlSample],
    ["richText", "markdown", htmlSample],
  ])("converts %s to %s", async (oldFormat, newFormat, input) => {
    const result = await convertNotes(oldFormat, newFormat, input);
    expect(result).toMatchSnapshot();
  });
});
