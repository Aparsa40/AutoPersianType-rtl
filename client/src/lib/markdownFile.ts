import type { PageSettings } from "@shared/schema";

export interface ParsedImage {
  id: string;
  src: string;
  alt?: string;
}

export interface ParsedMarkdown {
  content: string;
  pageSettings?: PageSettings;
  images: ParsedImage[];
}

export function parseMarkdownFile(text: string): ParsedMarkdown {
  let pageSettings: PageSettings | undefined = undefined;
  let cleaned = text || "";

  // First detect embedded original markdown inside HTML files saved by "Save Page"
  // Format: <!--ORIGINAL_MARKDOWN_BASE64:BASE64STRING-->
  const originalMatch = cleaned.match(/<!--\s*ORIGINAL_MARKDOWN_BASE64:([A-Za-z0-9+/=\n\r]+)\s*-->/);
  if (originalMatch) {
    try {
      const decoded = decodeURIComponent(escape(atob(originalMatch[1].replace(/\s+/g, ''))));
      // replace the cleaned content with the decoded original markdown
      cleaned = decoded.trim();
    } catch (err) {
      // ignore decoding errors and continue to parse normally
    }
  }

  // Extract page settings metadata in the form: <!--PAGE_SETTINGS:{...}-->
  const metaMatch = cleaned.match(/^<!--\s*PAGE_SETTINGS:(\{[\s\S]*?\})\s*-->/);
  if (metaMatch) {
    try {
      pageSettings = JSON.parse(metaMatch[1]);
    } catch (err) {
      // ignore malformed metadata
      pageSettings = undefined;
    }
    cleaned = cleaned.replace(metaMatch[0], "").trim();
  }

  const images: ParsedImage[] = [];
  // Match images like: ![alt](src) where src can be data: or any url/path
  const imgRegex = /!\[([^\]]*)\]\((data:[^)]+|[^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(cleaned)) !== null) {
    const alt = m[1];
    const src = m[2];
    const idMatch = alt?.match(/^image-(.+)$/);
    const id = idMatch ? idMatch[1] : crypto.randomUUID();
    images.push({ id, src, alt });
  }

  // Remove matched image markdown from content (so preview/content is clean)
  const contentWithoutImages = cleaned.replace(imgRegex, "").trim();

  return {
    content: contentWithoutImages,
    pageSettings: pageSettings || undefined,
    images,
  };
}
