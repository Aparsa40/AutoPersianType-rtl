import { describe, it, expect } from "vitest";
import { parseMarkdownFile } from "./markdownFile";

describe("parseMarkdownFile", () => {
  it("extracts page settings and images and strips images from content", () => {
    const md = `<!--PAGE_SETTINGS:{"fontSize":20}-->
# Title

Some text here.

![image-abc123](data:image/png;base64,AAAB)

More text.
`;
    const res = parseMarkdownFile(md);
    expect(res.pageSettings).toEqual({ fontSize: 20 });
    expect(res.images.length).toBe(1);
    expect(res.images[0].id).toBe("abc123");
    expect(res.content).toContain("# Title");
    expect(res.content).not.toContain("![](");
  });

  it("parses images without explicit id and assigns generated ids", () => {
    const md = `Hello

![alttext](https://example.com/x.png)`;
    const res = parseMarkdownFile(md);
    expect(res.pageSettings).toBeUndefined();
    expect(res.images.length).toBe(1);
    expect(res.images[0].src).toBe("https://example.com/x.png");
    expect(res.images[0].id).toBeDefined();
  });

  it("ignores malformed page settings and returns raw content", () => {
    const md = `<!--PAGE_SETTINGS:{"fontSize": }-->
# Bad meta`;
    const res = parseMarkdownFile(md);
    expect(res.pageSettings).toBeUndefined();
    expect(res.content).toContain("# Bad meta");
  });
});
