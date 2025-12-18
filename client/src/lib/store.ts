import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Document, EditorSettings, Theme, Heading } from "@shared/schema";
import { defaultSettings } from "@shared/schema";

interface EditorState {
  currentDocument: Document | null;
  content: string;
  theme: Theme;
  settings: EditorSettings;
  showSidebar: boolean;
  showPreview: boolean;
  showSettings: boolean;
  showTableBuilder: boolean;
  headings: Heading[];
  cursorPosition: { line: number; column: number };
  wordCount: number;
  charCount: number;
  detectedDirection: "ltr" | "rtl" | "mixed";
  isModified: boolean;

  /* Scrolling sync state */
  editorScrollPercent: number;
  previewScrollPercent: number;
  setEditorScrollPercent: (percent: number) => void;
  setPreviewScrollPercent: (percent: number) => void;

  /* precise center-line sync */
  editorCenterLine: number;
  previewCenterLine: number;
  setEditorCenterLine: (line: number) => void;
  setPreviewCenterLine: (line: number) => void;
  
  setContent: (content: string) => void;
  setTheme: (theme: Theme) => void;
  setSettings: (settings: Partial<EditorSettings>) => void;
  toggleSidebar: () => void;
  togglePreview: () => void;
  toggleSettings: () => void;
  toggleTableBuilder: () => void;
  setHeadings: (headings: Heading[]) => void;
  setCursorPosition: (line: number, column: number) => void;
  setWordCount: (count: number) => void;
  setCharCount: (count: number) => void;
  setDetectedDirection: (direction: "ltr" | "rtl" | "mixed") => void;
  newDocument: () => void;
  openDocument: (doc: Document) => void;
  saveDocument: () => Document | null;
  setIsModified: (modified: boolean) => void;
}

const sampleMarkdown = `# Welcome to TypeWriterPro

A professional Markdown editor with intelligent RTL/LTR support.

## Features

- **Monaco Editor**: VS Code-quality editing experience
- **Live Preview**: See your formatted content in real-time
- **RTL/LTR Auto-Detection**: Seamlessly write in Farsi and English
- **Theme Support**: Light and Dark modes
- **Export Options**: PDF, HTML, and Markdown

## نوشتن به فارسی

این ویرایشگر به صورت خودکار متن فارسی را تشخیص داده و جهت آن را از راست به چپ تنظیم می‌کند.

### Mixed Content

You can write in both English and فارسی in the same document. The editor will automatically detect the direction of each paragraph.

## Code Examples

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

## Tables

| Feature | Status |
|---------|--------|
| Editor | ✓ |
| Preview | ✓ |
| Export | ✓ |

## Get Started

Start typing in the editor on the left, and see the preview update in real-time on the right!
`;

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      currentDocument: null,
      content: sampleMarkdown,
      theme: "light",
      settings: defaultSettings,
      showSidebar: true,
      showPreview: true,
      showSettings: false,
      showTableBuilder: false,
      headings: [],
      cursorPosition: { line: 1, column: 1 },
      wordCount: 0,
      charCount: 0,
      detectedDirection: "ltr",
      isModified: false,
      
      setContent: (content) => set({ content, isModified: true }),
      
      setTheme: (theme) => {
        set({ theme });
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
      
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      toggleTableBuilder: () => set((state) => ({ showTableBuilder: !state.showTableBuilder })),
      
      setHeadings: (headings) => set({ headings }),
      setCursorPosition: (line, column) => set({ cursorPosition: { line, column } }),
      setWordCount: (count) => set({ wordCount: count }),
      setCharCount: (count) => set({ charCount: count }),
      setDetectedDirection: (direction) => set({ detectedDirection: direction }),

      /* scrolling */
      editorScrollPercent: 0,
      previewScrollPercent: 0,
      setEditorScrollPercent: (percent: number) => set({ editorScrollPercent: percent }),
      setPreviewScrollPercent: (percent: number) => set({ previewScrollPercent: percent }),

      /* precise center-line sync */
      editorCenterLine: 1,
      previewCenterLine: 1,
      setEditorCenterLine: (line: number) => set({ editorCenterLine: line }),
      setPreviewCenterLine: (line: number) => set({ previewCenterLine: line }),
      
      newDocument: () => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const doc: Document = {
          id,
          title: "Untitled Document",
          content: "",
          createdAt: now,
          updatedAt: now,
        };
        set({ currentDocument: doc, content: "", isModified: false });
      },
      
      openDocument: (doc) => {
        set({ currentDocument: doc, content: doc.content, isModified: false });
      },
      
      saveDocument: () => {
        const state = get();
        const now = new Date().toISOString();
        
        if (state.currentDocument) {
          const updated: Document = {
            ...state.currentDocument,
            content: state.content,
            updatedAt: now,
          };
          set({ currentDocument: updated, isModified: false });
          return updated;
        }
        
        const id = crypto.randomUUID();
        const newDoc: Document = {
          id,
          title: "Untitled Document",
          content: state.content,
          createdAt: now,
          updatedAt: now,
        };
        set({ currentDocument: newDoc, isModified: false });
        return newDoc;
      },
      
      setIsModified: (modified) => set({ isModified: modified }),
    }),
    {
      name: "typewriterpro-storage",
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        showSidebar: state.showSidebar,
        showPreview: state.showPreview,
        content: state.content,
        /* do not persist scroll/sync ephemeral UI state */
      }),
    }
  )
);
