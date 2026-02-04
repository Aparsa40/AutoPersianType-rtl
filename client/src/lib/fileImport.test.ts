import { describe, it, expect } from 'vitest';
import { parseMarkdownFile } from './fileImport';

describe('parseMarkdownFile', () => {
  it('parses page settings and images', () => {
    const settings = { fontFamily: 'Inter', fontSize: 20 };
    const md = `<!--PAGE_SETTINGS:${JSON.stringify(settings)}-->

# Hello

This is a test.

![image-abc](data:image/png;base64,AAA)

![myphoto](data:image/png;base64,BBB)
`;

    const parsed = parseMarkdownFile(md);
    expect(parsed.pageSettings).toEqual(settings);
    expect(parsed.content).toContain('# Hello');
    expect(parsed.content).not.toContain('![image-abc]');
    expect(parsed.images.length).toBe(2);
    expect(parsed.images[0].id).toBe('abc');
    expect(parsed.images[0].src).toContain('data:image/png;base64,AAA');
    expect(parsed.images[1].src).toContain('data:image/png;base64,BBB');
    expect(typeof parsed.images[1].id).toBe('string');
    expect(parsed.images[1].id.length).toBeGreaterThan(0);
  });

  it('returns content unchanged when no meta or images', () => {
    const md = `# No meta here\nSome text.`;
    const parsed = parseMarkdownFile(md);
    expect(parsed.pageSettings).toBeNull();
    expect(parsed.images.length).toBe(0);
    expect(parsed.content).toBe(md);
  });

  it('handles malformed page settings gracefully', () => {
    const md = `<!--PAGE_SETTINGS:{not: 'json'}-->

Content here.`;
    const parsed = parseMarkdownFile(md);
    expect(parsed.pageSettings).toBeNull();
    expect(parsed.content).toContain('Content here.');
  });
});
