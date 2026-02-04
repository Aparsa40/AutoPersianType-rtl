import { useEffect } from "react";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { MarkdownPreview } from "@/components/editor/MarkdownPreview";
import { MenuBar } from "@/components/editor/MenuBar";
import { SettingsPanel } from "@/components/editor/SettingsPanel";
import { TableBuilder } from "@/components/editor/TableBuilder";
import { CodeBlockBuilder } from "@/components/editor/CodeBlockBuilder";
// HeadingBuilder removed per simplified editor
import { ImageBuilder } from "@/components/editor/ImageBuilder";
import { PageSettingsPanel } from "@/components/editor/PageSettingsPanel";
import { DocumentOutline } from "@/components/editor/DocumentOutline";
import { StatusBar } from "@/components/editor/StatusBar";
import { IntroTour } from "@/components/editor/IntroTour";
import { useEditorStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function EditorPage() {
  const { theme, showPreview, showSidebar } = useEditorStore();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const { toast } = useToast();

  useEffect(() => {
    // keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            useEditorStore.getState().saveDocument();
            useEditorStore.getState().clearAutosave();
            toast({ title: "Saved", description: "Document saved." });
            break;
          case "n":
            if (!e.shiftKey) {
              e.preventDefault();
              // if modified, browser confirm and autosave behavior
              const s = useEditorStore.getState();
              if (s.isModified) {
                const confirmed = confirm("You have unsaved changes. Save before creating a new document?");
                if (confirmed) {
                  useEditorStore.getState().saveDocument();
                  useEditorStore.getState().clearAutosave();
                } else {
                  useEditorStore.getState().clearAutosave();
                }
              }

              useEditorStore.getState().newDocument();
            }
            break;
          case ",":
            e.preventDefault();
            useEditorStore.getState().toggleSettings();
            break;
          case "b":
            e.preventDefault();
            useEditorStore.getState().toggleSidebar();
            break;
          case "p":
            if (e.shiftKey) {
              e.preventDefault();
              useEditorStore.getState().togglePreview();
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toast]);

  // on mount: restore autosave if present, otherwise start a new blank document
  useEffect(() => {
    const autosave = useEditorStore.getState().loadAutosave();
    if (autosave) {
      useEditorStore.getState().openDocument(autosave);
      toast({ title: "Recovered", description: "Restored unsaved document from previous session." });
    } else {
      // ensure a new blank document is open every time
      useEditorStore.getState().newDocument();
    }

    // prompt user if they try to close with unsaved changes and autosave as needed
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const s = useEditorStore.getState();
      if (s.isModified) {
        // Ask user explicitly whether they want to save. Because file system APIs are async
        // we do a best-effort save and otherwise ensure an autosave is kept.
        try {
          const confirmed = confirm("شما تغییرات ذخیره‌نشده دارید. قبل از خروج می‌خواهید ذخیره کنید؟ OK برای ذخیره، Cancel برای ادامه بدون ذخیره");
          if (confirmed) {
            try {
              // attempt saving a document record/state (this clears autosave) and trigger a download/save file by user later
              s.saveDocument();
              s.clearAutosave();
            } catch (err) {
              // fallback to autosave if full save not possible right now
              s.saveAutosave();
            }
          } else {
            // user chose not to save: keep an autosave so we can restore next session
            s.saveAutosave();
          }
        } catch {}
        // Always show the browser confirmation to block accidental close
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const onPageHide = () => {
      const s = useEditorStore.getState();
      if (s.isModified) s.saveAutosave();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [toast]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background" data-testid="editor-page">
      <MenuBar />

      <div className="flex-1 flex overflow-hidden">
        <DocumentOutline />

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {showPreview ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={50} minSize={30} className="h-full">
                  <MonacoEditor />
                </ResizablePanel>
                <ResizableHandle withHandle className="bg-border" />
                <ResizablePanel defaultSize={50} minSize={30} className="h-full">
                  <div className="h-full bg-background border-l">
                    <MarkdownPreview />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <MonacoEditor />
            )}
          </div>
        </main>
      </div>

      <StatusBar />
      <SettingsPanel />
      <IntroTour />
      <PageSettingsPanel />
      <TableBuilder />
      <CodeBlockBuilder />
      <ImageBuilder />
    </div>
  );
}
