import { useEffect } from "react";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { MarkdownPreview } from "@/components/editor/MarkdownPreview";
import { MenuBar } from "@/components/editor/MenuBar";
import { SettingsPanel } from "@/components/editor/SettingsPanel";
import { TableBuilder } from "@/components/editor/TableBuilder";
import { CodeBlockBuilder } from "@/components/editor/CodeBlockBuilder";
import { HeadingBuilder } from "@/components/editor/HeadingBuilder";
import { ImageBuilder } from "@/components/editor/ImageBuilder";
import { DocumentOutline } from "@/components/editor/DocumentOutline";
import { StatusBar } from "@/components/editor/StatusBar";
import { useEditorStore } from "@/lib/store";
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            useEditorStore.getState().saveDocument();
            break;
          case "n":
            if (!e.shiftKey) {
              e.preventDefault();
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
  }, []);

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
      <TableBuilder />
      <CodeBlockBuilder />
      <HeadingBuilder />
      <ImageBuilder />
    </div>
  );
}
