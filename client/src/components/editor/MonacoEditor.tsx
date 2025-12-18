import { useRef, useCallback, useEffect } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEditorStore } from "@/lib/store";
import { detectTextDirection, countWords, countCharacters, extractHeadings } from "@/lib/direction";

export function MonacoEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const {
    content,
    setContent,
    theme,
    settings,
    setCursorPosition,
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

    // Ensure right-click focuses editor and places the cursor where clicked so
    // native context-menu actions like Paste target the editor (fixes paste via mouse)
    try {
      // focus + set position on mouse down (covers most browsers)
      editor.onMouseDown((ev) => {
        try {
          if (ev.event.rightButton) {
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
      const pasteHandler = (ev: ClipboardEvent) => {
        try {
          const text = ev.clipboardData?.getData("text/plain");
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
        // remove listener on dispose
        editor.onDidDispose(() => dom.removeEventListener("paste", pasteHandler as any));
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

  return (
    <div className="h-full w-full" data-testid="monaco-editor-container">
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
  );
}
