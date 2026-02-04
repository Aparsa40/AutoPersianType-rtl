import { useRef, useCallback, useEffect, useState } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEditorStore } from "@/lib/store";
import { detectTextDirection, countWords, countCharacters, extractHeadings } from "@/lib/direction";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";  // local styled context menu wrapper


export function MonacoEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const {
    content,
    setContent,
    theme,
    settings,
    setCursorPosition,
    setSelectionRange,
    setWordCount,
    setCharCount,
    setDetectedDirection,
    setHeadings,
    previewScrollPercent,
    setEditorScrollPercent,
    setEditorCenterLine,
  } = useEditorStore();

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme("typewriter-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "heading", foreground: "2563eb", fontStyle: "bold" },
        { token: "emphasis", fontStyle: "italic" },
        { token: "strong", fontStyle: "bold" },
        { token: "keyword.md", foreground: "2563eb" },
        { token: "string.link.md", foreground: "2563eb" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1a1a1a",
        "editor.lineHighlightBackground": "#f8f9fa",
        "editorLineNumber.foreground": "#6b7280",
        "editorLineNumber.activeForeground": "#1a1a1a",
        "editor.selectionBackground": "#dbeafe",
        "editorCursor.foreground": "#2563eb",
        "editor.inactiveSelectionBackground": "#e5e7eb",
      },
    });

    monaco.editor.defineTheme("typewriter-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "heading", foreground: "60a5fa", fontStyle: "bold" },
        { token: "emphasis", fontStyle: "italic" },
        { token: "strong", fontStyle: "bold" },
        { token: "keyword.md", foreground: "60a5fa" },
        { token: "string.link.md", foreground: "60a5fa" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#e0e0e0",
        "editor.lineHighlightBackground": "#252526",
        "editorLineNumber.foreground": "#6b7280",
        "editorLineNumber.activeForeground": "#e0e0e0",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#3b82f6",
        "editor.inactiveSelectionBackground": "#3e3e42",
      },
    });

    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition(e.position.lineNumber, e.position.column);
    });

    // track selection ranges so other UI (page settings) can apply to selection
    try {
      editor.onDidChangeCursorSelection((e) => {
        try {
          const sel = e.selection;
          setSelectionRange(sel.startLineNumber, sel.endLineNumber);
        } catch {}
      });
    } catch (err) {
      // ignore if API missing
    }

    // Ensure right-click focuses editor and places the cursor where clicked so
    // native context-menu actions like Paste target the editor (fixes paste via mouse)
    try {
      // focus + set position on mouse down (covers most browsers)
      editor.onMouseDown((ev) => {
        try {
          const isRightButton = Boolean(
            ev.event && (
              (ev.event as any).rightButton ||
              (ev.event as any).button === 2 ||
              (ev.event && (ev.event as any).browserEvent && (ev.event as any).browserEvent.button === 2)
            )
          );
          if (isRightButton) {
            editor.focus();
            if (ev.target && ev.target.position) {
              editor.setPosition(ev.target.position);
            }
          }
        } catch (err) {
          // ignore
        }
      });

      // also handle the explicit contextmenu event to be extra robust
      editor.onContextMenu((ev) => {
        try {
          editor.focus();
          if (ev.target && ev.target.position) {
            editor.setPosition(ev.target.position);
          }
        } catch (err) {
          // ignore
        }
      });

      // Listen for DOM paste events on the editor container so paste via
      // the browser context menu reliably inserts into the editor in all envs.
      const dom = editor.getDomNode();
      const pasteHandler = async (ev: ClipboardEvent) => {
        try {
          // Only handle paste if the editor is focused or the event target is inside the editor DOM
          const target = ev.target as Node | null;
          const editorDom = editor.getDomNode();
          const isInEditor = editorDom && (target === editorDom || (target && editorDom.contains(target)));
          const editorHasFocus = document.activeElement && editorDom && (document.activeElement === editorDom || editorDom.contains(document.activeElement));
          if (!isInEditor && !editorHasFocus) return; // let the event proceed normally

          // Prefer HTML clipboard if present and looks like rendered markdown/HTML
          const html = ev.clipboardData?.getData("text/html")?.trim();
          let text = ev.clipboardData?.getData("text/plain") ?? "";

          // If we have HTML and it contains block tags often produced by rendered markdown, convert it to markdown
          if (html && /<(p|h[1-6]|pre|code|blockquote|ul|ol|table|img)\b/i.test(html)) {
            try {
              // dynamic import Turndown to avoid bundling issues on server
              const TurndownService = (await import('turndown')).default;
              const td = new TurndownService({ codeBlockStyle: 'fenced' });
              const md = td.turndown(html);
              if (md && md.trim().length) {
                text = md;
              }
            } catch (err) {
              // fallback: if turndown not available, try to decode HTML entities in plain text
              try {
                const t = document.createElement('textarea');
                t.innerHTML = html;
                if (!text || text.trim().length < 10) text = t.value;
              } catch {}
            }
          }

          // If there's no rich HTML payload but the plain text looks like encoded HTML
          // (e.g., contains &lt; or literal tags), try decoding and turndown as well.
          if ((!html || html.trim() === '') && /&lt;|<[^>]+>/.test(text)) {
            try {
              let candidate = text;
              try { const t = document.createElement('textarea'); t.innerHTML = text; candidate = t.value; } catch {}
              const TurndownService = (await import('turndown')).default;
              const td = new TurndownService({ codeBlockStyle: 'fenced' });
              const md = td.turndown(candidate);
              if (md && md.trim().length) text = md;
            } catch (err) {
              // ignore
            }
          }

          // Normalize some rich-text characters to improve Markdown parsing when pasting
          if (text) {
            text = text.replace(/\u00A0/g, ' ').replace(/\u2022/g, '-'); // NBSP, bullet
            text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
          }

          if (text) {
            ev.preventDefault();
            // insert at current selection
            const sel = editor.getSelection();
            // ensure we pass a non-null IRange to satisfy monaco types
            const range = sel ?? editor.getModel()?.getFullModelRange() ?? { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
            editor.executeEdits("paste", [
              {
                range,
                text,
                forceMoveMarkers: true,
              },
            ]);
            editor.focus();
          }
        } catch (err) {
          // ignore
        }
      };
      if (dom) {
        dom.addEventListener("paste", pasteHandler as any);
        // also listen at document level to catch paste events triggered by the browser context menu
        document.addEventListener("paste", pasteHandler as any);
        // remove listeners on dispose
        editor.onDidDispose(() => {
          try { dom.removeEventListener("paste", pasteHandler as any); } catch {}
          try { document.removeEventListener("paste", pasteHandler as any); } catch {}
        });
      }
    } catch (err) {
      // older monaco builds may not support onContextMenu/onMouseDown, safe to ignore
    }

    // sync editor -> preview scroll
    editor.onDidScrollChange(() => {
      try {
        const top = editor.getScrollTop();
        const height = editor.getScrollHeight();
        const viewport = editor.getDomNode()?.clientHeight || 1;
        const max = Math.max(0, height - viewport);
        const percent = max > 0 ? top / max : 0;
        setEditorScrollPercent(percent);

        // compute visible center line and expose for precise preview sync
        try {
          const ranges = editor.getVisibleRanges();
          if (ranges && ranges.length) {
            const vr = ranges[0];
            const centerLine = Math.round((vr.startLineNumber + vr.endLineNumber) / 2);
            setEditorCenterLine(centerLine);
          }
        } catch (err) {
          // ignore
        }
      } catch (err) {
        // ignore
      }
    });

    editor.focus();
  }, [setCursorPosition]);

  const handleChange: OnChange = useCallback(
    (value) => {
      const newContent = value || "";
      setContent(newContent);

      const direction = detectTextDirection(newContent);
      setDetectedDirection(direction);

      setWordCount(countWords(newContent));
      setCharCount(countCharacters(newContent));

      const headings = extractHeadings(newContent);
      setHeadings(headings);
    },
    [setContent, setDetectedDirection, setWordCount, setCharCount, setHeadings]
  );

  useEffect(() => {
    const direction = detectTextDirection(content);
    setDetectedDirection(direction);
    setWordCount(countWords(content));
    setCharCount(countCharacters(content));
    setHeadings(extractHeadings(content));
  }, []);

  // apply incoming preview scroll (preview -> editor sync)
  const isSettingEditorScroll = useRef(false);
  useEffect(() => {
    if (!editorRef.current) return;
    if (isSettingEditorScroll.current) return;

    const editor = editorRef.current;
    try {
      const viewportH = editor.getDomNode()?.clientHeight || 1;
      const totalH = editor.getScrollHeight();
      const max = Math.max(0, totalH - viewportH);
      const top = Math.max(0, Math.min(max, Math.round(previewScrollPercent * max)));
      if (Math.abs(editor.getScrollTop() - top) > 2) {
        isSettingEditorScroll.current = true;
        editor.setScrollTop(top);
        // release after next tick
        setTimeout(() => (isSettingEditorScroll.current = false), 150);
      }
    } catch (err) {
      // ignore
    }
  }, [previewScrollPercent]);

  const goToLine = useCallback((line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  }, []);

  useEffect(() => {
    (window as any).goToEditorLine = goToLine;
  }, [goToLine]);

  const insertText = useCallback((text: string) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection) {
        editorRef.current.executeEdits("insert-text", [
          {
            range: selection,
            text,
            forceMoveMarkers: true,
          },
        ]);
        editorRef.current.focus();
      }
    }
  }, []);

  useEffect(() => {
    (window as any).insertTextAtCursor = insertText;
  }, [insertText]);

  const wrapSelectionWith = useCallback((prefix: string, suffix?: string) => {
    if (!editorRef.current) return;
    const ed = editorRef.current;
    try {
      const sel = ed.getSelection();
      if (!sel) return;
      const model = ed.getModel();
      if (!model) return;
      const selected = model.getValueInRange(sel);
      const newText = `${prefix}${selected}${suffix ?? prefix}`;
      ed.executeEdits('wrap-selection', [{ range: sel, text: newText, forceMoveMarkers: true }]);
      // restore a sensible selection around the wrapped text
      const start = sel.startLineNumber;
      const startCol = sel.startColumn + prefix.length;
      const endLine = sel.endLineNumber;
      const endCol = sel.endColumn + prefix.length;
      try { ed.setSelection({ startLineNumber: start, startColumn: startCol, endLineNumber: endLine, endColumn: endCol }); } catch {}
      ed.focus();
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    (window as any).wrapSelectionWith = wrapSelectionWith;
  }, [wrapSelectionWith]);

  // editor context menu actions
  const handleCut = () => {
    const ed = editorRef.current;
    if (!ed) return;
    try { ed.focus(); ed.trigger('keyboard', 'editor.action.clipboardCutAction', null); } catch { document.execCommand('cut'); }
  };
  const handleCopy = () => {
    const ed = editorRef.current;
    if (!ed) return;
    try { ed.trigger('keyboard', 'editor.action.clipboardCopyAction', null); } catch { document.execCommand('copy'); }
  };
  const handleSelectAll = () => {
    const ed = editorRef.current;
    if (!ed) return;
    try { ed.trigger('keyboard', 'editor.action.selectAll', null); } catch { document.execCommand('selectAll'); }
  };
  const handlePaste = async () => {
    const ed = editorRef.current;
    if (!ed) return;
    try {
      // clipboard API is more reliable than execCommand('paste') in modern browsers
      const text = await navigator.clipboard.readText();
      if (text) {
        const sel = ed.getSelection();
        const range = sel ?? ed.getModel()?.getFullModelRange() ?? { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
        ed.executeEdits('paste', [{ range, text, forceMoveMarkers: true }]);
        ed.focus();
      }
    } catch (err) {
      try { document.execCommand('paste'); } catch {}
    }
  };

  const handleSaveMarkdown = () => {
    const s = useEditorStore.getState();
    const meta = ""; // explicit: "Save Markdown" writes raw markdown so other editors show it properly
    const imageMd = s.blocks
      .filter((b) => b.type === "image")
      .map((b) => `\n\n![image-${b.id}](${b.src})`)
      .join("");
    const final = `${s.content}${imageMd}`;

    try {
      if ((window as any).showSaveFilePicker) {
        const handle = (window as any).showSaveFilePicker({ suggestedName: `${s.currentDocument?.title || 'document'}.md`, types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.txt'] } }] });
        // don't await in case browser prevents async during close; do a best-effort
        Promise.resolve(handle).then(async (h: any) => {
          const writable = await h.createWritable();
          await writable.write(final);
          await writable.close();
        }).catch(() => {
          // ignore
        });
        return;
      }
    } catch {}

    // fallback download
    const blob = new Blob([final], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${s.currentDocument?.title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="h-full w-full"
          data-testid="monaco-editor-container"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              editorRef.current?.focus();
              const native = (e as any).nativeEvent || e;
              (editorRef.current as any)?.getTargetAtClientPoint?.(native.clientX, native.clientY);
            } catch {}
          }}
          onMouseDown={(e) => {
            // ensure right-click on the wrapper also focuses the editor
            if ((e as any).button === 2) editorRef.current?.focus();
          }}
          style={{ touchAction: "auto" }}
        >
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={content}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            theme={theme === "dark" ? "typewriter-dark" : "typewriter-light"}
            options={{
              fontFamily: `'${settings.fontFamily}', 'Vazirmatn', 'JetBrains Mono', monospace`,
              fontSize: settings.fontSize,
              lineHeight: settings.lineHeight * settings.fontSize,
              wordWrap: settings.wordWrap ? "on" : "off",
              lineNumbers: settings.showLineNumbers ? "on" : "off",
              minimap: { enabled: settings.showMinimap },
              tabSize: settings.tabSize,
              scrollBeyondLastLine: false,
              renderWhitespace: "selection",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              padding: { top: 16, bottom: 16 },
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
              folding: true,
              foldingHighlight: true,
              links: true,
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              wordBasedSuggestions: "off",
              contextmenu: true,
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              },
            }}
          />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={handleCut}>بُرش</ContextMenuItem>
        <ContextMenuItem onSelect={handleCopy}>کپی</ContextMenuItem>
        <ContextMenuItem onSelect={handlePaste}>پیست</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleSelectAll}>انتخاب همه</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleSaveMarkdown}>ذخیره مارک‌داون</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
