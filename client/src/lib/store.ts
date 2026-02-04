import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Document, EditorSettings, Theme, Heading, PageSettings } from "@shared/schema";
import { defaultSettings, defaultPageSettings } from "@shared/schema";
import type { Block } from "@/lib/blocks";

interface EditorState {
  currentDocument: Document | null;
  content: string;
  theme: Theme;
  settings: EditorSettings;
  pageSettings: PageSettings;
  showSidebar: boolean;
  showPreview: boolean;
  showSettings: boolean;
  showPageSettings: boolean;
  showTableBuilder: boolean;
  showCodeBlockBuilder: boolean;
  showImageBuilder: boolean;
  headings: Heading[];
  cursorPosition: { line: number; column: number };
  selectionRange: { startLine: number; endLine: number } | null;
  wordCount: number;
  charCount: number;
  detectedDirection: "ltr" | "rtl" | "mixed";
  isModified: boolean;

  // onboarding / intro data (extensible)
  showIntro: boolean;
  introItems: { id: string; title: string; description: string }[];
  focusedIntroId?: string | null;
  toggleIntro: () => void;
  setShowIntro: (visible: boolean) => void;
  openIntroFor: (id: string) => void;
  setIntroItems: (items: { id: string; title: string; description: string }[]) => void;
  addIntroItem: (item: { id: string; title: string; description: string }) => void;

  // autosave helpers
  saveAutosave: () => void;
  loadAutosave: () => Document | null;
  clearAutosave: () => void;

  // persisted UI scroll sync
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

  // uploaded custom fonts (persisted)
  uploadedFonts: { id: string; name: string; family?: string; url: string }[];
  addUploadedFont: (font: { id: string; name: string; family?: string; url: string }) => void;
  removeUploadedFont: (id: string) => void;

  setContent: (content: string) => void;
  setTheme: (theme: Theme) => void;
  setSettings: (settings: Partial<EditorSettings>) => void;
  setPageSettings: (settings: Partial<PageSettings>) => void;
  toggleSidebar: () => void;
  togglePreview: () => void;
  toggleSettings: () => void;
  togglePageSettings: () => void;
  toggleTableBuilder: () => void;
  toggleCodeBlockBuilder: () => void;
  toggleImageBuilder: () => void;
  setHeadings: (headings: Heading[]) => void;
  setCursorPosition: (line: number, column: number) => void;
  setSelectionRange: (startLine: number, endLine: number) => void;
  setWordCount: (count: number) => void;
  setCharCount: (count: number) => void;
  setDetectedDirection: (direction: "ltr" | "rtl" | "mixed") => void;
  newDocument: () => void;
  openDocument: (doc: Document) => void;
  saveDocument: () => Document | null;
  setIsModified: (modified: boolean) => void;
}

const AUTOSAVE_KEY = "AutoPersianType.autosave.v1";

const sampleMarkdown = `# Welcome to  AutoPersianType pro_RTL
A professional Markdown editor with intelligent RTL/LTR support.
`;

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      currentDocument: null,
      // start with a blank document by default; if an autosave is available we will restore it on mount
      content: "",
      theme: "light",
      settings: defaultSettings,
      // page-level settings (affect preview & exports)
      pageSettings: defaultPageSettings,
      showSidebar: true,
      showPreview: true,
      showSettings: false,
      showPageSettings: false,
      showTableBuilder: false,
      showCodeBlockBuilder: false,
      showImageBuilder: false,
      // uploaded custom fonts persisted across sessions
      uploadedFonts: [],
      headings: [],
      cursorPosition: { line: 1, column: 1 },
      selectionRange: null,
      wordCount: 0,
      charCount: 0,
      detectedDirection: "ltr",
      isModified: false,

      editorScrollPercent: 0,
      previewScrollPercent: 0,
      editorCenterLine: 1,
      previewCenterLine: 1,

      blocks: [],

      // onboarding / intro defaults
      showIntro: (() => {
        try {
          const seenNew = localStorage.getItem("typewriterpro-intro-seen");
          const seenLegacy = localStorage.getItem("AutoPersianType.intro_shown");
          return !seenNew && !seenLegacy;
        } catch (e) {
          return false;
        }
      })(),
      introItems: [
        { id: 'file', title: 'File', description: 'اینجا می‌توانید فایل جدید بسازید، فایل موجود را باز کنید، ذخیره یا صادر کنید.' },
        { id: 'edit', title: 'Edit', description: 'عملیات ویرایشی مانند Undo/Redo، جستجو و جایگزینی در اینجا قرار دارند.' },
        { id: 'view', title: 'View', description: 'نمایش پنل‌ها و پیش‌نمایش را می‌توانید اینجا روشن یا خاموش کنید.' },
        { id: 'tools', title: 'Tools', description: 'ابزارهایی برای وارد کردن تصاویر، تیترها، جدول و تنظیمات صفحه.' },
      ],
      toggleIntro: () => set((s) => ({ showIntro: !s.showIntro })),
      setShowIntro: (visible: boolean) => set({ showIntro: visible }),
      openIntroFor: (id: string) => set({ showIntro: true, focusedIntroId: id }),
      setIntroItems: (items) => set({ introItems: items }),
      addIntroItem: (item) => set((s) => ({ introItems: [...s.introItems, item] })),


      setContent: (content) => {
        // synchronize blocks: remove any blocks that no longer have a marker in content
        try {
          const ids = new Set<string>();
          const re = /<!--\s*BLOCK_ID:([a-f0-9-]+)\s*-->/ig;
          let m: RegExpExecArray | null;
          while ((m = re.exec(content))) {
            if (m[1]) ids.add(m[1]);
          }
          set((state) => ({
            content,
            isModified: true,
            blocks: state.blocks.filter(b => ids.size === 0 ? true : ids.has(b.id)),
          }));
        } catch (e) {
          // fallback to simple set on error
          set({ content, isModified: true });
        }
      },

      // autosave helpers
      saveAutosave: () => {
        const s = get();
        if (!s.isModified && !s.content) return;
        try {
          const doc: Document = {
            id: s.currentDocument?.id || 'autosave',
            title: s.currentDocument?.title || 'Unsaved Document',
            content: s.content,
            createdAt: s.currentDocument?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pageSettings: s.pageSettings,
          };
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(doc));
        } catch {}
      },
      loadAutosave: () => {
        try {
          const raw = localStorage.getItem(AUTOSAVE_KEY);
          if (!raw) return null;
          return JSON.parse(raw) as Document;
        } catch { return null; }
      },
      clearAutosave: () => {
        try { localStorage.removeItem(AUTOSAVE_KEY); } catch {}
      },
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
      setPageSettings: (newPageSettings) =>
        set((state) => ({ pageSettings: { ...state.pageSettings, ...newPageSettings } })),
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      togglePageSettings: () => set((state) => ({ showPageSettings: !state.showPageSettings })),
      toggleTableBuilder: () => set((state) => ({ showTableBuilder: !state.showTableBuilder })),
      toggleCodeBlockBuilder: () => set((state) => ({ showCodeBlockBuilder: !state.showCodeBlockBuilder })),
      toggleImageBuilder: () => set((state) => ({ showImageBuilder: !state.showImageBuilder })),
      addUploadedFont: (font) => set((state) => ({ uploadedFonts: [...state.uploadedFonts, font] })),
      removeUploadedFont: (id) => set((state) => ({ uploadedFonts: state.uploadedFonts.filter(f => f.id !== id) })),

      setHeadings: (headings) => set({ headings }),
      setCursorPosition: (line, column) => set({ cursorPosition: { line, column } }),
      setSelectionRange: (startLine, endLine) => set({ selectionRange: { startLine, endLine } }),
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
        // Reset content, blocks and page settings for a true fresh document
        set({ currentDocument: doc, content: "", isModified: false, blocks: [], pageSettings: defaultPageSettings });
        // clear any previous autosave so it's a clean new start
        try { localStorage.removeItem(AUTOSAVE_KEY); } catch {}
      },
      openDocument: (doc) => set({ currentDocument: doc, content: doc.content, isModified: false, pageSettings: (doc as any).pageSettings || defaultPageSettings }),
      saveDocument: () => {
        const state = get();
        const now = new Date().toISOString();
        if (state.currentDocument) {
          const updated: Document = { ...state.currentDocument, content: state.content, updatedAt: now, pageSettings: state.pageSettings };
          set({ currentDocument: updated, isModified: false });
          // saved to document state -> clear any autosave
          get().clearAutosave();
          return updated;
        }
        const id = crypto.randomUUID();
        const newDoc: Document = { id, title: "Untitled Document", content: state.content, createdAt: now, updatedAt: now, pageSettings: state.pageSettings };
        set({ currentDocument: newDoc, isModified: false });
        get().clearAutosave();
        return newDoc;
      },
      setIsModified: (modified) => set({ isModified: modified }),
    }),
    {
      name: "AutoPersianType",
      // persist only UI settings and non-document state; document/content lifecycle
      // is managed via autosave (for unsaved) or external file (for saved).
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        pageSettings: state.pageSettings,
        uploadedFonts: state.uploadedFonts,
        showSidebar: state.showSidebar,
        showPreview: state.showPreview,
        blocks: state.blocks,
      }),
    }
  )
);
