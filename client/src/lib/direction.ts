const persianWord = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const latinWord = /[A-Za-z\u00C0-\u00FF0-9]/;

// Detect the overall text direction of a document-ish string. This returns
// "ltr"|"rtl"|"mixed" but is conservative — used mainly for summaries.
export function detectTextDirection(text: string): "ltr" | "rtl" | "mixed" {
  if (!text || text.trim().length === 0) return "ltr";

  // coarse word-based counts rather than per-character heuristics.
  const words = text.split(/\s+/).filter(Boolean);
  let persian = 0;
  let latin = 0;
  for (const w of words) {
    if (persianWord.test(w)) persian++;
    else if (latinWord.test(w)) latin++;
  }

  const total = persian + latin;
  if (total === 0) return "ltr";
  if (persian / total > 0.6) return "rtl";
  if (latin / total > 0.6) return "ltr";
  return "mixed";
}

// Detect the paragraph/line direction in a semantic way: count words that
// look Persian vs words that look Latin. Persian dominance forces RTL; a
// single inline English word inside Persian paragraph will not flip the
// paragraph direction because we operate at word-level dominance.
export function detectParagraphDirection(text: string): "ltr" | "rtl" {
  const trimmed = (text || "").trim();
  if (!trimmed) return "ltr";

    // split on any run of characters that are not latin/persian letters, digits or underscore
    const words = trimmed.split(/[^A-Za-z0-9_\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/).filter(Boolean);
  let persian = 0;
  let latin = 0;
  for (const w of words) {
    if (persianWord.test(w)) persian++;
    else if (latinWord.test(w)) latin++;
  }

  if (persian === 0 && latin === 0) {
    // fallback to scanning any character for direction
    for (const ch of trimmed) {
      if (persianWord.test(ch)) return "rtl";
      if (latinWord.test(ch)) return "ltr";
    }
    return "ltr";
  }

  if (persian > latin) return "rtl";
  return "ltr";
}

export function getDirectionStyles(direction: "ltr" | "rtl"): {
  direction: "ltr" | "rtl";
  textAlign: "left" | "right";
} {
  return {
    direction,
    textAlign: direction === "rtl" ? "right" : "left",
  };
}

export function wrapParagraphsWithDirection(html: string, autoDirection: boolean): string {
  if (!autoDirection) return html;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const blockElements = tempDiv.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote");
  blockElements.forEach((element) => {
    const text = element.textContent || "";
    const direction = detectParagraphDirection(text);
    try { element.setAttribute('dir', direction); } catch {}
  });
  return tempDiv.innerHTML;
}

export function extractHeadings(content: string): Array<{
  id: string;
  text: string;
  level: number;
  line: number;
}> {
  const headings: Array<{
    id: string;
    text: string;
    level: number;
    line: number;
  }> = [];

  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF]/g, "")
        .replace(/\s+/g, "-");

      headings.push({
        id: `heading-${index}-${id}`,
        text,
        level,
        line: index + 1,
      });
    }
  });

  return headings;
}

export function countWords(text: string): number {
  if (!text.trim()) return 0;

  const cleanText = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~`>\-|]/g, "")
    .trim();

  const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

export function countCharacters(text: string): number {
  return text.length;
}
