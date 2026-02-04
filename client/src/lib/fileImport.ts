export interface ParsedFile {
  content: string;
  pageSettings?: Record<string, any> | null;
  images: Array<{ id: string; src: string; alt?: string }>;
}

export function parseMarkdownFile(text: string): ParsedFile {
  const res: ParsedFile = { content: text || "", pageSettings: null, images: [] };

  if (!text) return res;

  // Extract PAGE_SETTINGS metadata if present
  const metaMatch = text.match(/^<!--\s*PAGE_SETTINGS:(\{[\s\S]*?\})\s*-->/);
  let working = text;
  if (metaMatch) {
    try {
      res.pageSettings = JSON.parse(metaMatch[1]);
    } catch (e) {
      res.pageSettings = null;
    }
    working = working.replace(metaMatch[0], "").trim();
  }

  // Extract images: ![alt](src)
  const imgRegex = /!\[([^\]]*)\]\((data:[^)]+|[^)]+)\)/g;
  let m: RegExpExecArray | null;
  const images: Array<{ id: string; src: string; alt?: string }> = [];
  while ((m = imgRegex.exec(working)) !== null) {
    const alt = m[1];
    const src = m[2];
    const idMatch = alt?.match(/^image-(.+)$/);
    const id = idMatch ? idMatch[1] : crypto?.randomUUID?.() ?? `img-${images.length}-${Date.now()}`;
    images.push({ id, src, alt });
  }

  // Remove images from content
  const cleaned = working.replace(imgRegex, "").trim();

  res.content = cleaned;
  res.images = images;

  return res;
}
