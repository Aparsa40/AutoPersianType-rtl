import { useMemo, useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { renderMarkdown, getMarkdownStyles } from "@/lib/markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MarkdownPreview() {
  const { content, blocks, theme, settings, cursorPosition, setPreviewScrollPercent, editorScrollPercent, editorCenterLine, setPreviewCenterLine } = useEditorStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const isSettingScroll = useRef(false);
  const { toast } = useToast();

  const html = useMemo(() => {
    const blockHtml = blocks.map(block => {
      if (block.type === "heading") {
        const Tag = `h${block.settings.level || 1}` as any;
        return `<${Tag} style="
          font-family: ${block.settings.fontFamily || 'Vazirmatn'};
          font-size: ${block.settings.fontSize}px;
          color: ${block.settings.color};
          background-color: ${block.settings.background};
          font-weight: ${block.settings.bold ? 'bold' : 'normal'};
          font-style: ${block.settings.italic ? 'italic' : 'normal'};
          text-align: ${block.settings.alignment || 'left'};
          border-top: ${block.settings.border?.sides.includes('top') ? block.settings.border.width+'px '+block.settings.border.style+' '+block.settings.border.color : 'none'};
          border-bottom: ${block.settings.border?.sides.includes('bottom') ? block.settings.border.width+'px '+block.settings.border.style+' '+block.settings.border.color : 'none'};
        ">${block.content}</${Tag}>`;
      }

      if (block.type === "image") {
        const w = block.settings.width ? `${block.settings.width}px` : 'auto';
        const h = block.settings.height ? `${block.settings.height}px` : 'auto';
        const left = typeof block.settings.x === 'number' ? `left:${block.settings.x}px;position:absolute;` : '';
        const top = typeof block.settings.y === 'number' ? `top:${block.settings.y}px;position:absolute;` : '';
        const bgRemoved = block.settings.backgroundRemoved ? 'data-bg-removed="true"' : '';
        return `<div class="image-block" data-block-id="${block.id}" ${bgRemoved} style="position:relative; ${left} ${top} width: ${w}; height: ${h}; display:inline-block;">
          <img src="${block.src}" style="width:100%; height:100%; object-fit:contain; user-select:none; -webkit-user-drag:none;" draggable="false" />
        </div>`;
      }

      return '';
    }).join("\n");

    return renderMarkdown(content) + blockHtml;
  }, [content, blocks]);

  const styles = useMemo(() => getMarkdownStyles(theme), [theme]);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.querySelectorAll("a").forEach(link => {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      });
    }
  }, [html]);

  // scroll sync: preview -> store
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

      try {
        const viewportRect = viewport.getBoundingClientRect();
        const centerY = viewportRect.top + viewport.clientHeight / 2;
        const nodes = el.querySelectorAll('[data-source-line]');
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as HTMLElement;
          const rect = node.getBoundingClientRect();
          if (rect.top <= centerY && rect.bottom >= centerY) {
            const line = Number(node.getAttribute('data-source-line') || 1);
            (window as any).goToEditorLine?.(line);
            setPreviewCenterLine(line);
            break;
          }
        }
      } catch {}
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [setPreviewScrollPercent]);

  // editor -> preview sync
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
    } catch {}
  }, [editorScrollPercent]);

  // center-line sync
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const viewport = el.parentElement as HTMLElement | null;
    if (!viewport || !editorCenterLine) return;

    const target = el.querySelector(`[data-source-line="${editorCenterLine}"]`) as HTMLElement | null
      || el.querySelector(`[data-source-line]`) as HTMLElement | null;

    if (target) {
      isSettingScroll.current = true;
      target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      setTimeout(() => (isSettingScroll.current = false), 150);
    }
  }, [editorCenterLine]);

  // click in preview -> jump to editor
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-source-line]") as HTMLElement | null;
      if (!target) return;
      const line = Number(target.getAttribute("data-source-line") || 1);
      (window as any).goToEditorLine?.(line);
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);

  // image interactions: drag, resize, right-click menu
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    // make preview a positioned container so absolute children can move
    if (!el.style.position) el.style.position = 'relative';

    let currentMenu: HTMLElement | null = null;

    const removeMenu = () => {
      if (currentMenu) {
        currentMenu.remove();
        currentMenu = null;
      }
    };

    const onDocClick = (e: MouseEvent) => {
      removeMenu();
    };

    document.addEventListener('click', onDocClick);

    const images = el.querySelectorAll('.image-block');
    images.forEach((wrap) => {
      const id = wrap.getAttribute('data-block-id');
      const img = wrap.querySelector('img') as HTMLImageElement | null;
      if (!img || !id) return;

      // DRAG
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      const onMove = (ev: MouseEvent) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const left = Math.max(0, Math.round(startLeft + dx));
        const top = Math.max(0, Math.round(startTop + dy));
        (wrap as HTMLElement).style.left = left + 'px';
        (wrap as HTMLElement).style.top = top + 'px';
      };

      const onUp = (ev: MouseEvent) => {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        (wrap as HTMLElement).style.zIndex = '';
        const left = parseInt((wrap as HTMLElement).style.left || '0', 10) || 0;
        const top = parseInt((wrap as HTMLElement).style.top || '0', 10) || 0;
        (window as any).useEditorStore?.getState?.().updateBlock?.(id, { x: left, y: top });
        toast({ title: 'Image moved' });
      };

      const onDown = (ev: MouseEvent) => {
        if ((ev as any).button !== 0) return;
        isDragging = true;
        startX = ev.clientX;
        startY = ev.clientY;
        startLeft = (wrap as HTMLElement).offsetLeft;
        startTop = (wrap as HTMLElement).offsetTop;
        (wrap as HTMLElement).style.position = 'absolute';
        (wrap as HTMLElement).style.zIndex = '60';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        ev.preventDefault();
      };

      img.addEventListener('mousedown', onDown);

      // RESIZE
      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      wrap.appendChild(handle);

      let isResizing = false;
      let rStartX = 0;
      let rStartY = 0;
      let rStartW = 0;
      let rStartH = 0;

      const onResizeMove = (ev: MouseEvent) => {
        if (!isResizing) return;
        const newW = Math.max(24, Math.round(rStartW + (ev.clientX - rStartX)));
        const newH = Math.max(24, Math.round(rStartH + (ev.clientY - rStartY)));
        (wrap as HTMLElement).style.width = newW + 'px';
        (wrap as HTMLElement).style.height = newH + 'px';
      };

      const onResizeUp = (ev: MouseEvent) => {
        if (!isResizing) return;
        isResizing = false;
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeUp);
        (window as any).useEditorStore?.getState?.().updateBlock?.(id, { width: (wrap as HTMLElement).offsetWidth, height: (wrap as HTMLElement).offsetHeight });
        toast({ title: 'Image resized' });
      };

      const onResizeDown = (ev: MouseEvent) => {
        ev.stopPropagation();
        isResizing = true;
        rStartX = ev.clientX;
        rStartY = ev.clientY;
        rStartW = (wrap as HTMLElement).offsetWidth;
        rStartH = (wrap as HTMLElement).offsetHeight;
        document.addEventListener('mousemove', onResizeMove);
        document.addEventListener('mouseup', onResizeUp);
      };

      handle.addEventListener('mousedown', onResizeDown);

      // CONTEXT MENU
      const onContext = (ev: MouseEvent) => {
        ev.preventDefault();
        removeMenu();
        const menu = document.createElement('div');
        menu.className = 'image-context-menu';

        const btn = (text: string, cb: () => void) => {
          const b = document.createElement('button');
          b.textContent = text;
          b.addEventListener('click', () => { cb(); removeMenu(); });
          menu.appendChild(b);
        };

        btn('Cut', () => { useEditorStore.getState().removeBlock(id); toast({ title: 'Image removed' }); });
        btn('Copy src', () => { navigator.clipboard?.writeText(img.src).then(()=>toast({ title: 'Image source copied' })).catch(()=>toast({ title: 'Copy failed' })); });
        btn('Duplicate', () => { const state = useEditorStore.getState(); state.addBlock({ id: crypto.randomUUID(), type: 'image', src: img.src, settings: { width: (wrap as HTMLElement).offsetWidth, height: (wrap as HTMLElement).offsetHeight, x: (wrap as HTMLElement).offsetLeft + 20, y: (wrap as HTMLElement).offsetTop + 20 } }); toast({ title: 'Image duplicated' }); });
        btn('Remove Background (quick)', () => { useEditorStore.getState().updateBlock(id, { backgroundRemoved: true }); toast({ title: 'Background removed (approx.)' }); });

        document.body.appendChild(menu);
        menu.style.left = ev.clientX + 'px';
        menu.style.top = ev.clientY + 'px';
        currentMenu = menu;
      };

      wrap.addEventListener('contextmenu', onContext as EventListener);

      // cleanup for this image
      (wrap as any).__cleanup = () => {
        img.removeEventListener('mousedown', onDown);
        handle.removeEventListener('mousedown', onResizeDown);
        wrap.removeEventListener('contextmenu', onContext as EventListener);
        try { handle.remove(); } catch {}
      };
    });

    return () => {
      removeMenu();
      document.removeEventListener('click', onDocClick);
      images.forEach((wrap) => { const fn = (wrap as any).__cleanup; if (fn) try { fn(); } catch {} });
    };
  }, [html, blocks, toast]);

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
