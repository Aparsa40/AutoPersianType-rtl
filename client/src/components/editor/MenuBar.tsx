import { useCallback } from "react";
import {
  File,
  FilePlus,
  FolderOpen,
  Save,
  Download,
  FileText,
  FileCode,
  Undo2,
  Redo2,
  Search,
  Replace,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Table2,
  List,
  Image,
  Settings,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useEditorStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { renderMarkdown } from "@/lib/markdown";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function MenuBar() {
  const {
    content,
    theme,
    setTheme,
    showSidebar,
    showPreview,
    toggleSidebar,
    togglePreview,
    toggleSettings,
    toggleTableBuilder,
    toggleCodeBlockBuilder,
    toggleHeadingBuilder,
    toggleImageBuilder,
    newDocument,
    saveDocument,
  } = useEditorStore();

  const { toast } = useToast();

  const handleNew = useCallback(() => {
    newDocument();
    toast({
      title: "New Document",
      description: "Created a new blank document.",
    });
  }, [newDocument, toast]);

  const handleOpen = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.txt,.markdown";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        useEditorStore.getState().setContent(text);
        toast({
          title: "File Opened",
          description: `Loaded: ${file.name}`,
        });
      }
    };
    input.click();
  }, [toast]);

  const handleSave = useCallback(() => {
    saveDocument();
    toast({
      title: "Document Saved",
      description: "Your changes have been saved locally.",
    });
  }, [saveDocument, toast]);

  const handleSaveAs = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "File Downloaded",
      description: "Markdown file has been downloaded.",
    });
  }, [content, toast]);

  const handleExportMarkdown = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: "Markdown file exported successfully.",
    });
  }, [content, toast]);

  const handleExportHTML = useCallback(() => {
    const html = renderMarkdown(content, true);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Document</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', 'Vazirmatn', system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.7;
      color: #1a1a1a;
    }
    h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { font-family: 'JetBrains Mono', monospace; background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.875em; }
    pre { background: #f6f8fa; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    pre code { background: transparent; padding: 0; }
    blockquote { margin: 1em 0; padding: 0.5em 1em; border-left: 4px solid #2563eb; background: rgba(0,0,0,0.02); }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid #e0e0e0; padding: 0.5em 1em; text-align: left; }
    th { background: rgba(0,0,0,0.02); font-weight: 600; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: "HTML file exported successfully.",
    });
  }, [content, toast]);

  const handleExportPDF = useCallback(async () => {
    toast({
      title: "Generating PDF",
      description: "Please wait while we generate your PDF...",
    });

    try {
      const html = renderMarkdown(content, true);
      
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        padding: 40px;
        background: white;
        font-family: 'Inter', 'Vazirmatn', system-ui, sans-serif;
        line-height: 1.7;
        color: #1a1a1a;
      `;
      container.innerHTML = `
        <style>
          h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
          h1 { font-size: 2rem; }
          h2 { font-size: 1.5rem; }
          h3 { font-size: 1.25rem; }
          a { color: #2563eb; }
          code { font-family: 'JetBrains Mono', monospace; background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.875em; }
          pre { background: #f6f8fa; padding: 1rem; border-radius: 8px; overflow-x: auto; }
          pre code { background: transparent; padding: 0; }
          blockquote { margin: 1em 0; padding: 0.5em 1em; border-left: 4px solid #2563eb; background: rgba(0,0,0,0.02); }
          table { width: 100%; border-collapse: collapse; margin: 1em 0; }
          th, td { border: 1px solid #e0e0e0; padding: 0.5em 1em; text-align: left; }
          th { background: rgba(0,0,0,0.02); font-weight: 600; }
        </style>
        ${html}
      `;
      document.body.appendChild(container);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("document.pdf");

      toast({
        title: "Export Complete",
        description: "PDF file exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [content, toast]);

  const handleUndo = useCallback(() => {
    document.execCommand("undo");
  }, []);

  const handleRedo = useCallback(() => {
    document.execCommand("redo");
  }, []);

  const handleSearch = useCallback(() => {
    const editor = (window as any).monaco?.editor?.getEditors?.()?.[0];
    if (editor) {
      editor.getAction("actions.find")?.run();
    }
  }, []);

  const handleReplace = useCallback(() => {
    const editor = (window as any).monaco?.editor?.getEditors?.()?.[0];
    if (editor) {
      editor.getAction("editor.action.startFindReplaceAction")?.run();
    }
  }, []);

  return (
    <header className="h-12 border-b bg-background flex items-center justify-between px-2 gap-1 flex-shrink-0" data-testid="menu-bar">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 px-3">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm hidden sm:inline">AutoPersianType-Pro</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" data-testid="menu-file">
              File
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={handleNew} data-testid="menu-file-new">
              <FilePlus className="mr-2 h-4 w-4" />
              New
              <DropdownMenuShortcut>Ctrl+N</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpen} data-testid="menu-file-open">
              <FolderOpen className="mr-2 h-4 w-4" />
              Open
              <DropdownMenuShortcut>Ctrl+O</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSave} data-testid="menu-file-save">
              <Save className="mr-2 h-4 w-4" />
              Save
              <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSaveAs} data-testid="menu-file-save-as">
              <Download className="mr-2 h-4 w-4" />
              Save As
              <DropdownMenuShortcut>Ctrl+Shift+S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleExportMarkdown} data-testid="menu-export-md">
                  <FileText className="mr-2 h-4 w-4" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportHTML} data-testid="menu-export-html">
                  <FileCode className="mr-2 h-4 w-4" />
                  Export as HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} data-testid="menu-export-pdf">
                  <File className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" data-testid="menu-edit">
              Edit
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={handleUndo} data-testid="menu-edit-undo">
              <Undo2 className="mr-2 h-4 w-4" />
              Undo
              <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRedo} data-testid="menu-edit-redo">
              <Redo2 className="mr-2 h-4 w-4" />
              Redo
              <DropdownMenuShortcut>Ctrl+Y</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSearch} data-testid="menu-edit-search">
              <Search className="mr-2 h-4 w-4" />
              Search
              <DropdownMenuShortcut>Ctrl+F</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReplace} data-testid="menu-edit-replace">
              <Replace className="mr-2 h-4 w-4" />
              Replace
              <DropdownMenuShortcut>Ctrl+H</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" data-testid="menu-view">
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={toggleSidebar} data-testid="menu-view-sidebar">
              {showSidebar ? (
                <PanelLeftClose className="mr-2 h-4 w-4" />
              ) : (
                <PanelLeftOpen className="mr-2 h-4 w-4" />
              )}
              {showSidebar ? "Hide Sidebar" : "Show Sidebar"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={togglePreview} data-testid="menu-view-preview">
              {showPreview ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark")}>
              <DropdownMenuRadioItem value="light" data-testid="menu-theme-light">
                <Sun className="mr-2 h-4 w-4" />
                Light Theme
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" data-testid="menu-theme-dark">
                <Moon className="mr-2 h-4 w-4" />
                Dark Theme
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" data-testid="menu-tools">
              Tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={toggleHeadingBuilder} data-testid="menu-tools-heading">
              <FileText className="mr-2 h-4 w-4" />
              Insert Heading
            </DropdownMenuItem>

            <DropdownMenuItem onClick={toggleCodeBlockBuilder} data-testid="menu-tools-codeblock">
              <FileCode className="mr-2 h-4 w-4" />
              Insert Code Block
            </DropdownMenuItem>

            <DropdownMenuItem onClick={toggleTableBuilder} data-testid="menu-tools-table">
              <Table2 className="mr-2 h-4 w-4" />
              Table Builder
            </DropdownMenuItem>

            <DropdownMenuItem onClick={toggleImageBuilder} data-testid="menu-tools-insert-image">
              <Image className="mr-2 h-4 w-4" />
              Insert Picture
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleSidebar} data-testid="menu-tools-outline">
              <List className="mr-2 h-4 w-4" />
              Document Outline
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleSettings} data-testid="menu-tools-settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          data-testid="button-theme-toggle"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSettings}
          data-testid="button-settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
