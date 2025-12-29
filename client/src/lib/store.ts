import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Document, EditorSettings, Theme, Heading } from "@shared/schema";
import { defaultSettings } from "@shared/schema";
import type { Block } from "@/lib/blocks";

interface EditorState {
  currentDocument: Document | null;
  content: string;
  theme: Theme;
  settings: EditorSettings;
  showSidebar: boolean;
  showPreview: boolean;
  showSettings: boolean;
  showTableBuilder: boolean;
  showCodeBlockBuilder: boolean;
  showHeadingBuilder: boolean;
  showImageBuilder: boolean;
  headings: Heading[];
  cursorPosition: { line: number; column: number };
  wordCount: number;
  charCount: number;
  detectedDirection: "ltr" | "rtl" | "mixed";
  isModified: boolean;

  editorScrollPercent: number;
  previewScrollPercent: number;
  setEditorScrollPercent: (percent: number) => void;
  setPreviewScrollPercent: (percent: number) => void;

  editorCenterLine: number;
  previewCenterLine: number;
  setEditorCenterLine: (line: number) => void;
  setPreviewCenterLine: (line: number) => void;

  blocks: Block[];
  addBlock: (block: Block) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, newSettings: Partial<Block["settings"]>) => void;

  setContent: (content: string) => void;
  setTheme: (theme: Theme) => void;
  setSettings: (settings: Partial<EditorSettings>) => void;
  toggleSidebar: () => void;
  togglePreview: () => void;
  toggleSettings: () => void;
  toggleTableBuilder: () => void;
  toggleCodeBlockBuilder: () => void;
  toggleHeadingBuilder: () => void;
  toggleImageBuilder: () => void;
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

const sampleMarkdown = `# Welcome to  AutoPersianType pro_RTL
A professional Markdown editor with intelligent RTL/LTR support.
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
      showCodeBlockBuilder: false,
      showHeadingBuilder: false,
      showImageBuilder: false,
      headings: [],
      cursorPosition: { line: 1, column: 1 },
      wordCount: 0,
      charCount: 0,
      detectedDirection: "ltr",
      isModified: false,

      editorScrollPercent: 0,
      previewScrollPercent: 0,
      editorCenterLine: 1,
      previewCenterLine: 1,

      blocks: [],

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
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      toggleTableBuilder: () => set((state) => ({ showTableBuilder: !state.showTableBuilder })),
      toggleCodeBlockBuilder: () => set((state) => ({ showCodeBlockBuilder: !state.showCodeBlockBuilder })),
      toggleHeadingBuilder: () => set((state) => ({ showHeadingBuilder: !state.showHeadingBuilder })),
      toggleImageBuilder: () => set((state) => ({ showImageBuilder: !state.showImageBuilder })),
      setHeadings: (headings) => set({ headings }),
      setCursorPosition: (line, column) => set({ cursorPosition: { line, column } }),
      setWordCount: (count) => set({ wordCount: count }),
      setCharCount: (count) => set({ charCount: count }),
      setDetectedDirection: (direction) => set({ detectedDirection: direction }),
      setEditorScrollPercent: (percent) => set({ editorScrollPercent: percent }),
      setPreviewScrollPercent: (percent) => set({ previewScrollPercent: percent }),
      setEditorCenterLine: (line) => set({ editorCenterLine: line }),
      setPreviewCenterLine: (line) => set({ previewCenterLine: line }),

      addBlock: (block) => set((state) => ({ blocks: [...state.blocks, block] })),
      removeBlock: (id) => set((state) => ({ blocks: state.blocks.filter(b => b.id !== id) })),
      updateBlock: (id, newSettings) =>
        set((state) => ({
          blocks: state.blocks.map(b => b.id === id ? { ...b, settings: { ...b.settings, ...newSettings } } : b)
        })),

      newDocument: () => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const doc: Document = { id, title: "Untitled Document", content: "", createdAt: now, updatedAt: now };
        set({ currentDocument: doc, content: "", isModified: false });
      },
      openDocument: (doc) => set({ currentDocument: doc, content: doc.content, isModified: false }),
      saveDocument: () => {
        const state = get();
        const now = new Date().toISOString();
        if (state.currentDocument) {
          const updated: Document = { ...state.currentDocument, content: state.content, updatedAt: now };
          set({ currentDocument: updated, isModified: false });
          return updated;
        }
        const id = crypto.randomUUID();
        const newDoc: Document = { id, title: "Untitled Document", content: state.content, createdAt: now, updatedAt: now };
        set({ currentDocument: newDoc, isModified: false });
        return newDoc;
      },
      setIsModified: (modified) => set({ isModified: modified }),
    }),
    {
      name: "AutoPersianType",
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        showSidebar: state.showSidebar,
        showPreview: state.showPreview,
        content: state.content,
        blocks: state.blocks,
      }),
    }
  )
);
