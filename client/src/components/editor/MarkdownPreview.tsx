import { useMemo, useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store";
import { renderMarkdown, getMarkdownStyles } from "@/lib/markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MarkdownPreview() {
  const { content, theme, settings, cursorPosition, setPreviewScrollPercent, editorScrollPercent, editorCenterLine, setPreviewCenterLine } = useEditorStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const isSettingScroll = useRef(false);

  const html = useMemo(() => {
    return renderMarkdown(content, settings.autoDirection);
  }, [content, settings.autoDirection]);

  const styles = useMemo(() => {
    return getMarkdownStyles(theme);
  }, [theme]);

  useEffect(() => {
    if (previewRef.current) {
      const links = previewRef.current.querySelectorAll("a");
      links.forEach((link) => {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      });
    }
  }, [html]);

  // two-way scroll sync: preview -> store
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const viewport = el.parentElement as HTMLElement | null;
    if (!viewport) return;

    const onScroll = () => {
      if (isSettingScroll.current) return;
      const scrollTop = viewport.scrollTop;
      const max = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      const percent = max > 0 ? scrollTop / max : 0;
      setPreviewScrollPercent(percent);

      // detect element at center of viewport and inform editor to center there
      try {
        const viewportRect = viewport.getBoundingClientRect();
        const centerY = viewportRect.top + viewport.clientHeight / 2;
        const nodes = el.querySelectorAll('[data-source-line]');
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as HTMLElement;
          const rect = node.getBoundingClientRect();
          if (rect.top <= centerY && rect.bottom >= centerY) {
            const line = Number(node.getAttribute('data-source-line') || 1);
            const fn = (window as any).goToEditorLine as ((line: number) => void) | undefined;
            if (typeof fn === 'function') fn(line);
            // update preview center marker
            setPreviewCenterLine(line);
            break;
          }
        }
      } catch (err) {
        // ignore
      }
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [setPreviewScrollPercent]);

  // apply editor -> preview sync
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const viewport = el.parentElement as HTMLElement | null;
    if (!viewport) return;

    try {
      const max = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      const top = Math.max(0, Math.min(max, Math.round(editorScrollPercent * max)));
      isSettingScroll.current = true;
      viewport.scrollTo({ top, behavior: "smooth" });
      setTimeout(() => (isSettingScroll.current = false), 150);
    } catch (err) {
      // ignore
    }
  }, [editorScrollPercent]);

  // when editor center-line updates, scroll preview to corresponding element
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const viewport = el.parentElement as HTMLElement | null;
    if (!viewport) return;
    if (!editorCenterLine) return;

    try {
      const target = el.querySelector(`[data-source-line="${editorCenterLine}"]`) as HTMLElement | null
        || el.querySelector(`[data-source-line]`) as HTMLElement | null;
      if (target) {
        isSettingScroll.current = true;
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        setTimeout(() => (isSettingScroll.current = false), 150);
      }
    } catch (err) {
      // ignore
    }
  }, [editorCenterLine]);

  // when cursor changes or html changes, scroll preview to the element with matching data-source-line
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const viewport = el.parentElement as HTMLElement | null;
    if (!viewport) return;

    const line = cursorPosition?.line || 1;
    const target = el.querySelector(`[data-source-line="${line}"]`) as HTMLElement | null
      || el.querySelector(`[data-source-line]`) as HTMLElement | null;

    if (target) {
      try {
        // highlight
        target.classList.add("preview-cursor-highlight");
        // scroll it into the center of the viewport
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        setTimeout(() => target.classList.remove("preview-cursor-highlight"), 900);
      } catch (err) {
        // ignore
      }
    }
  }, [cursorPosition, html]);

  // click in preview -> jump to editor line
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const lineEl = target.closest("[data-source-line]") as HTMLElement | null;
      if (!lineEl) return;
      const line = Number(lineEl.getAttribute("data-source-line") || 1);
      // call editor helper (set earlier by MonacoEditor)
      const fn = (window as any).goToEditorLine as ((line: number) => void) | undefined;
      if (typeof fn === "function") fn(line);
    };

    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="h-full w-full flex flex-col" data-testid="markdown-preview-container">
      <style>{styles}</style>
      <ScrollArea className="flex-1">
        <div
          ref={previewRef}
          className="markdown-preview p-8"
          style={{
            fontFamily: `'Inter', 'Vazirmatn', system-ui, sans-serif`,
            fontSize: settings.fontSize,
            lineHeight: settings.lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
          data-testid="markdown-preview-content"
        />
      </ScrollArea>
    </div>
  );
}
