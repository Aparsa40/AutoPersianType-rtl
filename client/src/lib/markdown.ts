import { marked } from "marked";
import { detectParagraphDirection } from "./direction";
import { useEditorStore } from "@/lib/store";
import DOMPurify from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: true,
});

function addDirectionToElements(html: string, content: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Attach block IDs from HTML comments like <!--BLOCK_ID:uuid-->
  try {
    // createTreeWalker signature expects at most 3 args in DOM typings
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_COMMENT, null as any);
    let node: ChildNode | null = walker.nextNode() as unknown as ChildNode | null;
    while (node) {
      const txt = (node.nodeValue || "").trim();
      const m = txt.match(/^BLOCK_ID:(\S+)$/);
      if (m) {
        const id = m[1];
        // Only bind to the immediate preceding block element (p/h1..h6 etc.).
        // Use previousElementSibling which ignores text nodes and ensures immediacy.
        let el = (node as any).previousElementSibling as Element | null;
        // If previous sibling is not a supported block tag, do NOT walk further back
        // — instead try the immediate next sibling as a last resort.
        if (!el || !/^(P|H1|H2|H3|H4|H5|H6|LI|BLOCKQUOTE)$/i.test(el.tagName)) {
          const next = (node as any).nextElementSibling as Element | null;
          if (next && /^(P|H1|H2|H3|H4|H5|H6|LI|BLOCKQUOTE)$/i.test(next.tagName)) {
            el = next;
          } else {
            el = null;
          }
        }

        if (el) {
          try {
            (el as HTMLElement).setAttribute('data-block-id', id);
          } catch {}
        }
      }
      node = walker.nextNode() as unknown as ChildNode | null;
    }
  } catch (e) {
    // ignore comment processing failures
  }

  const blockElements = tempDiv.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, table, tr");

  let lastIndex = 0;
  blockElements.forEach((element) => {
    const htmlEl = element as HTMLElement;
    const tag = element.tagName;

    // Only split paragraphs/blockquote/list items on single-line breaks (generated as <br> by marked)
    const splittable = tag === "P" || tag === "BLOCKQUOTE" || tag === "LI";
    if (splittable && /<br\s*\/?>/i.test(htmlEl.innerHTML)) {
      // split preserving inline HTML per segment
      const parts = htmlEl.innerHTML.split(/<br\s*\/?\>/i);
      parts.forEach((part) => {
        const partHTML = (part || "").trim();
        const partText = (partHTML ? ("" + (new DOMParser().parseFromString(partHTML, 'text/html').body.textContent || '')).trim() : "");

        const newEl = document.createElement(tag.toLowerCase());
        newEl.innerHTML = partHTML || "&nbsp;";

        const direction = detectParagraphDirection(partText);
        newEl.setAttribute("dir", direction);

        // annotate source line for this segment
        if (partText) {
          const idx = content.indexOf(partText, lastIndex);
          let line = 1;
          if (idx !== -1) {
            line = content.slice(0, idx).split("\n").length;
            lastIndex = idx + partText.length;
          }
          newEl.setAttribute("data-source-line", String(line));
        } else {
          // empty line: approximate the next line number
          const nextNewline = content.indexOf("\n", lastIndex);
          let line = 1;
          if (nextNewline !== -1) {
            line = content.slice(0, nextNewline).split("\n").length + 1;
            lastIndex = nextNewline + 1;
          }
          newEl.setAttribute("data-source-line", String(line));
        }

        htmlEl.parentNode?.insertBefore(newEl, htmlEl);
      });

      // remove original combined element
      htmlEl.remove();
      return;
    }

    // Fallback: set direction and source line as before
    const text = (element.textContent || "").trim();
    const direction = detectParagraphDirection(text);
    htmlEl.setAttribute("dir", direction);

    // annotate with approximate source line by searching the source content
    if (text) {
      const idx = content.indexOf(text, lastIndex);
      let line = 1;
      if (idx !== -1) {
        line = content.slice(0, idx).split("\n").length;
        lastIndex = idx + text.length;
      }
      htmlEl.setAttribute("data-source-line", String(line));
    }

    // Block mapping via <!--BLOCK_ID:...--> is preserved (data-block-id),
    // but we intentionally DO NOT apply per-block inline styles here. Page
    // settings should be applied at document-level CSS only. Any block
    // metadata is left for interactive behaviors (images, removal, etc.).

    if (element.tagName === "BLOCKQUOTE") {
      if (direction === "rtl") {
        htmlEl.style.borderRight = "4px solid hsl(217, 91%, 60%)";
        htmlEl.style.borderLeft = "none";
        htmlEl.style.paddingRight = "1rem";
        htmlEl.style.paddingLeft = "0.5em";
      } else {
        htmlEl.style.borderLeft = "4px solid hsl(217, 91%, 60%)";
        htmlEl.style.borderRight = "none";
        htmlEl.style.paddingLeft = "1rem";
        htmlEl.style.paddingRight = "0.5em";
      }
    }
  });

  return tempDiv.innerHTML;
}

function normalizeContent(raw: string): string {
  // remove zero-width / invisible characters that break parsing
  let s = raw.replace(/\u200B|\uFEFF|\u2060/g, "");
  // normalize punctuation and common rich-text glyphs
  s = s.replace(/\u00A0/g, ' ').replace(/\u2022/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  // decode a few common HTML entities if they look like encoded HTML
  if (/&lt;|&gt;|&amp;/.test(s)) {
    try {
      const t = document.createElement('textarea');
      t.innerHTML = s;
      s = t.value;
    } catch {}
  }
  return s.trim();
}

export function renderMarkdown(content: string, autoDirection: boolean = true): string {
  if (!content) return "";

  try {
    const normalized = typeof document !== 'undefined' ? normalizeContent(content) : content;

    let html = (marked.parse(normalized) as string) || "";

    // If content looks like HTML-encoded (e.g., &lt;h1&gt;), decode and prefer that HTML
    try {
      if (typeof document !== 'undefined') {
        const candidate = ((): string => {
          const t = document.createElement('textarea');
          t.innerHTML = normalized;
          return t.value;
        })();
        if (candidate !== normalized && /<\s*[a-zA-Z][^>]*>/.test(candidate)) {
          html = candidate;
        }
      }
    } catch (e) {
      // ignore
    }

    // If parsing produced empty HTML for non-empty content, check if the
    // source looks like raw HTML (e.g. pasted rendered markdown). In that
    // case render the HTML directly instead of escaping it so pasted
    // HTML appears as the user expects.
    if (html.trim() === "" && normalized.trim() !== "") {
      if (/<([A-Za-z][A-Za-z0-9-_]*)\b[^>]*>/.test(normalized)) {
        // treat content as HTML
        html = normalized;
      } else {
        // Try a secondary normalization pass (convert bullets, smart quotes, extra whitespace)
        try {
          const alt = normalized.replace(/\u2022/g, '-').replace(/\u00A0/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();
          const altHtml = (marked.parse(alt) as string) || "";
          if (altHtml.trim() !== "") {
            html = altHtml;
          } else {
            console.warn("renderMarkdown: parsed HTML is empty for non-empty content. Showing raw markdown for debugging.", normalized.slice(0, 200));
            return `<pre class="markdown-raw p-4 bg-yellow-50 border border-yellow-200 rounded text-sm overflow-auto">${normalized.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
          }
        } catch (e) {
          console.warn("renderMarkdown: secondary parse failed", e);
          return `<pre class="markdown-raw p-4 bg-yellow-50 border border-yellow-200 rounded text-sm overflow-auto">${normalized.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
        }
      }
    }

    // Replace code blocks for embedded demos: html/css/js -> placeholder div (handled by preview)
    try {
      // replace <pre><code class="language-html">...</code></pre>
      html = html.replace(/<pre><code class="(language-)?(html|css|js|javascript)">([\s\S]*?)<\/code><\/pre>/gi, (m, _cls, lang, inner) => {
        try {
          const text = inner.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
          const payload = btoa(unescape(encodeURIComponent(text)));
          return `<div class="embedded-demo" data-lang="${lang.toLowerCase()}" data-content="${payload}"></div>`;
        } catch (e) {
          return m;
        }
      });
    } catch (e) {}

    // Sanitize the output HTML to prevent XSS (DOMPurify)
    try {
      html = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    } catch (e) {
      // If DOMPurify isn't available, proceed with existing HTML (not ideal but fails safe)
    }

    // Apply per-code-block font/size settings from wrapper divs (e.g., inserted by the CodeBlock dialog)
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const blocks = tmp.querySelectorAll('div[data-code-font]');
      blocks.forEach((block) => {
        const fontName = block.getAttribute('data-code-font');
        const fontSize = block.getAttribute('data-code-font-size');
        const pre = block.querySelector('pre');
        if (pre) {
          if (fontName) pre.style.fontFamily = fontName;
          if (fontSize) pre.style.fontSize = fontSize + 'px';
          pre.classList.add('custom-code-block');
        }
      });
      html = tmp.innerHTML;
    } catch (e) {
      // ignore any post-processing errors
    }

    if (autoDirection && typeof document !== "undefined") {
      const out = addDirectionToElements(html, content);
      if (!out || out.trim() === "") {
        console.warn("renderMarkdown: addDirectionToElements returned empty HTML for content excerpt:", content.slice(0, 200));
        return `<pre class="markdown-raw p-4 bg-yellow-50 border border-yellow-200 rounded text-sm overflow-auto">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
      }
      return out;
    }

    return html;
  } catch (error) {
    console.error("Markdown parsing error:", error);
    return `<pre class="markdown-raw p-4 bg-red-50 border border-red-200 rounded text-sm overflow-auto">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
  }
}

export function getMarkdownStyles(theme: "light" | "dark"): string {
  const isDark = theme === "dark";

  return `
    .markdown-preview {
      font-family: 'Inter', 'Vazirmatn', system-ui, sans-serif;
      line-height: 1.7;
      color: ${isDark ? "#e0e0e0" : "#1a1a1a"};
    }

    .markdown-preview h1,
    .markdown-preview h2,
    .markdown-preview h3,
    .markdown-preview h4,
    .markdown-preview h5,
    .markdown-preview h6 {
      font-weight: 600;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      line-height: 1.3;
    }

    .markdown-preview h1 { font-size: 2rem; }
    .markdown-preview h2 { font-size: 1.5rem; }
    .markdown-preview h3 { font-size: 1.25rem; }
    .markdown-preview h4 { font-size: 1.125rem; }
    .markdown-preview h5 { font-size: 1rem; }
    .markdown-preview h6 { font-size: 0.875rem; }

    .markdown-preview p {
      margin: 1em 0;
    }

    .markdown-preview a {
      color: ${isDark ? "#60a5fa" : "#2563eb"};
      text-decoration: none;
    }

    .markdown-preview a:hover {
      text-decoration: underline;
    }

    .markdown-preview code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.875em;
      background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"};
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }

    .markdown-preview pre {
      background: ${isDark ? "#1e1e1e" : "#f6f8fa"};
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;
    }

    .markdown-preview pre code {
      background: transparent;
      padding: 0;
    }

    .markdown-preview blockquote {
      margin: 1em 0;
      padding: 0.5em 1em;
      background: ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"};
      border-radius: 4px;
    }

    .markdown-preview ul,
    .markdown-preview ol {
      margin: 1em 0;
      padding-left: 2em;
    }

    .markdown-preview li {
      margin: 0.25em 0;
    }

    .markdown-preview table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }

    .markdown-preview th,
    .markdown-preview td {
      border: 1px solid ${isDark ? "#3e3e42" : "#e0e0e0"};
      padding: 0.5em 1em;
      text-align: left;
    }

    .markdown-preview th {
      background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"};
      font-weight: 600;
    }

    .markdown-preview tr:nth-child(even) {
      background: ${isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"};
    }

    .markdown-preview img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }

    .markdown-preview hr {
      border: none;
      border-top: 1px solid ${isDark ? "#3e3e42" : "#e0e0e0"};
      margin: 2em 0;
    }

    /* highlight block where editor cursor is located */
    .markdown-preview .preview-cursor-highlight {
      outline: 3px solid ${isDark ? "#60a5fa" : "#2563eb"};
      border-radius: 6px;
      background: ${isDark ? "rgba(96,165,250,0.06)" : "rgba(37,99,235,0.03)"};
      transition: background 180ms ease, outline 180ms ease;
    }

    .markdown-preview strong {
      font-weight: 600;
    }

    .markdown-preview em {
      font-style: italic;
    }
  `;
}
