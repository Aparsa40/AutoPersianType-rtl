import { useMemo, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { renderMarkdown, getMarkdownStyles } from "@/lib/markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MarkdownPreview() {
  const { content, blocks, theme, settings, pageSettings, cursorPosition, setPreviewScrollPercent, editorScrollPercent, editorCenterLine, setPreviewCenterLine } = useEditorStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const isSettingScroll = useRef(false);
  const { toast } = useToast();

  const html = useMemo(() => {

    const blockHtml = blocks.map(block => {
      try {
        const rendered = renderMarkdown(block.content || "");
        const blockFont = (block.settings.direction === 'rtl') ? (block.settings.fontFamilyFa || block.settings.fontFamily) : (block.settings.fontFamilyEn || block.settings.fontFamily);

        const style = `font-family: ${blockFont || 'Vazirmatn'}; font-size: ${block.settings.fontSize}px; color: ${block.settings.color}; background-color: ${block.settings.background || 'transparent'}; font-weight: ${block.settings.bold ? 'bold' : 'normal'}; font-style: ${block.settings.italic ? 'italic' : 'normal'}; text-align: ${block.settings.alignment || 'left'};`;

        if (block.type === 'image') {
          const w = block.settings.width ? `${block.settings.width}px` : 'auto';
          const h = block.settings.height ? `${block.settings.height}px` : 'auto';
          const left = typeof block.settings.x === 'number' ? `left:${block.settings.x}px;position:absolute;` : '';
          const top = typeof block.settings.y === 'number' ? `top:${block.settings.y}px;position:absolute;` : '';
          const bgRemoved = block.settings.backgroundRemoved ? 'data-bg-removed="true"' : '';
          return `<div class="image-block" data-block-id="${block.id}" ${bgRemoved} style="position:relative; ${left} ${top} width: ${w}; height: ${h}; display:inline-block;">
            <img src="${block.src}" style="width:100%; height:100%; object-fit:contain; user-select:none; -webkit-user-drag:none;" draggable="false" />
          </div>`;
        }

        return `<div class="block" data-block-id="${block.id}" style="${style}">${rendered}</div>`;
      } catch (e) {
        return '';
      }
    }).join("\n");

    return renderMarkdown(content);
  }, [content, blocks]);

  const styles = useMemo(() => getMarkdownStyles(theme), [theme]);

  const pageLevelStyles = useMemo(() => {
    try {
      const fa = pageSettings.fontFamilyFa || pageSettings.fontFamily || 'Vazirmatn';
      const en = pageSettings.fontFamilyEn || pageSettings.fontFamily || 'Inter';
      return `
        /* document-level font and language mapping */
        .markdown-preview { font-family: '${en}', system-ui, sans-serif; line-height: ${pageSettings.lineHeight}; }
        .markdown-preview [dir="rtl"] { font-family: '${fa}', system-ui, sans-serif; }
        .markdown-preview [dir="ltr"] { font-family: '${en}', system-ui, sans-serif; }
        .markdown-preview [dir="rtl"] { text-align: right; }
        .markdown-preview [dir="ltr"] { text-align: left; }
        /* ensure code blocks keep monospace */
        .markdown-preview code, .markdown-preview pre { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
      `;
    } catch {
      return '';
    }
  }, [pageSettings.fontFamily, pageSettings.fontFamilyEn, pageSettings.fontFamilyFa]);

  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.querySelectorAll("a").forEach(link => {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      });

      // Handle embedded demos (created by renderMarkdown placeholders)
      const embeds = previewRef.current.querySelectorAll('.embedded-demo');
      embeds.forEach((el) => {
        try {
          const lang = (el as HTMLElement).getAttribute('data-lang') || 'html';
          const payload = (el as HTMLElement).getAttribute('data-content') || '';
          if (!payload) return;
          const src = decodeURIComponent(escape(atob(payload)));

          // create iframe container
          const iframe = document.createElement('iframe');
          iframe.setAttribute('sandbox', 'allow-scripts');
          iframe.style.width = '100%';
          iframe.style.border = '1px solid var(--border)';
          iframe.style.borderRadius = '8px';
          iframe.style.minHeight = '120px';
          iframe.style.display = 'block';
          iframe.style.overflow = 'auto';

          // prepare srcdoc depending on language
          let doc = '';
          if (lang === 'html') {
            doc = src;
          } else if (lang === 'css') {
            doc = `<!doctype html><html><head><meta charset="utf-8"><style>${src}</style></head><body><div class="demo">Example content to preview CSS</div></body></html>`;
          } else { // js / javascript
            doc = `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="out"></div><script>try{${src}}catch(e){document.body.innerHTML='<pre style="color:red">'+(e&&e.message||e)+'</pre>'}</script></body></html>`;
          }

          // set srcdoc via blob URL to avoid srcdoc sanitizer issues and allow scripts
          try {
            const blob = new Blob([doc], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            iframe.src = url;
            // cleanup blob URL on unload later
            (iframe as any).__blobUrl = url;
          } catch (e) {
            // fallback to srcdoc
            try { iframe.setAttribute('srcdoc', doc); } catch {}
          }

          // replace placeholder with iframe
          el.replaceWith(iframe);
        } catch (e) {
          // ignore per-item errors
        }
      });

      // cleanup blob urls on unmount
      // add copy handler so copying from preview yields Markdown source
      const copyHandler = (ev: ClipboardEvent) => {
        try {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) return;
          const range = sel.getRangeAt(0);
          const root = previewRef.current as HTMLElement;
          const nodes = Array.from(root.querySelectorAll('[data-source-line]')) as HTMLElement[];
          const linesFound: number[] = [];
          nodes.forEach((n) => {
            try {
              if (range.intersectsNode(n)) {
                const v = Number(n.getAttribute('data-source-line') || 0);
                if (v) linesFound.push(v);
              }
            } catch {}
          });

          let md = '';
          const all = (content || '').split('\n');
          if (linesFound.length) {
            const min = Math.max(1, Math.min(...linesFound));
            const max = Math.max(...linesFound);
            md = all.slice(min - 1, max).join('\n');
          } else {
            // fallback: copy entire source when selection can't be mapped
            md = content || '';
          }

          if (!md) return;
          ev.preventDefault();
          if (ev.clipboardData) {
            ev.clipboardData.setData('text/plain', md);
            try { ev.clipboardData.setData('text/markdown', md); } catch {}
          } else {
            try { navigator.clipboard.writeText(md); } catch {}
          }
          toast({ title: 'Copied Markdown' });
        } catch (e) {
          // swallow
        }
      };

      try { previewRef.current.addEventListener('copy', copyHandler as any); } catch {}

      return () => {
        const iframes = previewRef.current?.querySelectorAll('iframe');
        if (iframes) {
          iframes.forEach((f) => { try { const url = (f as any).__blobUrl; if (url) URL.revokeObjectURL(url); } catch {} });
        }
        try { previewRef.current?.removeEventListener('copy', copyHandler as any); } catch {}
      };
    }
  }, [html]);

  // context menu + source toggle for preview
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    let menuEl: HTMLElement | null = null;
    const removeMenu = () => { if (menuEl) { menuEl.remove(); menuEl = null; } };
    const onDocClick = () => removeMenu();
    document.addEventListener('click', onDocClick);

    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      removeMenu();
      const menu = document.createElement('div');
      menu.className = 'preview-context-menu p-2 bg-popover border rounded shadow';
      menu.style.position = 'fixed';
      menu.style.left = e.clientX + 'px';
      menu.style.top = e.clientY + 'px';
      menu.style.zIndex = '9999';

      const btn = (text: string, cb: () => void) => {
        const b = document.createElement('button');
        b.className = 'block w-full text-sm text-left px-2 py-1 hover:bg-accent/10';
        b.textContent = text;
        b.addEventListener('click', () => { cb(); removeMenu(); });
        menu.appendChild(b);
      };

      btn('Copy as Markdown', async () => { try { await navigator.clipboard.writeText(content); toast({ title: 'Copied Markdown' }); } catch { toast({ title: 'Copy failed' }); } });
      btn('Copy as HTML', async () => { try { await navigator.clipboard.writeText(el.innerHTML); toast({ title: 'Copied HTML' }); } catch { toast({ title: 'Copy failed' }); } });
      btn(showSource ? 'Show Rendered' : 'Show Source', () => setShowSource(s => !s));

      document.body.appendChild(menu);
      menuEl = menu;
    };

    el.addEventListener('contextmenu', onContext as EventListener);

    return () => {
      removeMenu();
      document.removeEventListener('click', onDocClick);
      try { el.removeEventListener('contextmenu', onContext as EventListener); } catch {}
    };
  }, [content, showSource, toast]);

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

  const outerBorderStyle: any = {};
  if (pageSettings.border && pageSettings.border.width && pageSettings.border.sides && pageSettings.border.sides.length) {
    const b = pageSettings.border;
    outerBorderStyle.borderTop = b.sides.includes('top') ? `${b.width}px ${b.style} ${b.color}` : undefined;
    outerBorderStyle.borderBottom = b.sides.includes('bottom') ? `${b.width}px ${b.style} ${b.color}` : undefined;
    outerBorderStyle.borderLeft = b.sides.includes('left') ? `${b.width}px ${b.style} ${b.color}` : undefined;
    outerBorderStyle.borderRight = b.sides.includes('right') ? `${b.width}px ${b.style} ${b.color}` : undefined;
  }

  return (
    <div className="h-full w-full flex flex-col" data-testid="markdown-preview-container" style={{ ...outerBorderStyle }}>
      <style>{styles + pageLevelStyles}</style>
      <ScrollArea className="flex-1" style={{ background: pageSettings.background || undefined }}>
        <div
          ref={previewRef}
          className="markdown-preview"
          style={{
            minHeight: '100%',
            fontSize: `${pageSettings.fontSize}px`,
            color: pageSettings.color,
            background: pageSettings.background || undefined,
            paddingTop: pageSettings.marginTop,
            paddingBottom: pageSettings.marginBottom,
            paddingLeft: pageSettings.marginLeft,
            paddingRight: pageSettings.marginRight,
            boxSizing: 'border-box',
          }}
          data-testid="markdown-preview-content"
        >
          {showSource ? (
            <textarea
              value={content}
              onChange={(e) => useEditorStore.getState().setContent(e.target.value)}
              className="w-full h-full bg-transparent text-sm p-4"
              style={{ minHeight: '200px', resize: 'vertical' }}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
