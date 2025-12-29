import { marked } from "marked";
import { detectParagraphDirection } from "./direction";
import DOMPurify from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: true,
});

function addDirectionToElements(html: string, content: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

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
        newEl.style.direction = direction;
        newEl.style.textAlign = direction === "rtl" ? "right" : "left";

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
    htmlEl.style.direction = direction;
    htmlEl.style.textAlign = direction === "rtl" ? "right" : "left";

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

export function renderMarkdown(content: string, autoDirection: boolean = true): string {
  if (!content) return "";
  
  try {
    let html = (marked.parse(content) as string) || "";

    // If content looks like HTML-encoded (e.g., &lt;h1&gt;), decode and prefer that HTML
    try {
      if (typeof document !== 'undefined') {
        const candidate = ((): string => {
          const t = document.createElement('textarea');
          t.innerHTML = content;
          return t.value;
        })();
        if (candidate !== content && /<\s*[a-zA-Z][^>]*>/.test(candidate)) {
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
    if (html.trim() === "" && content.trim() !== "") {
      if (/<([A-Za-z][A-Za-z0-9-_]*)\b[^>]*>/.test(content)) {
        // treat content as HTML
        html = content;
      } else {
        console.warn("renderMarkdown: parsed HTML is empty for non-empty content. Showing raw markdown for debugging.", content.slice(0, 200));
        return `<pre class="markdown-raw p-4 bg-yellow-50 border border-yellow-200 rounded text-sm overflow-auto">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
      }
    }

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
