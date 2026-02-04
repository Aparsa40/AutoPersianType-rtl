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
import { parseMarkdownFile } from "@/lib/markdownFile";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function MenuBar() {
  const {
    content,
    theme,
    setTheme,
    showSidebar,
    showPreview,
    pageSettings,
    blocks,
    uploadedFonts,
    toggleSidebar,
    togglePreview,
    toggleSettings,
    togglePageSettings,
    toggleTableBuilder,
    toggleCodeBlockBuilder,
    toggleImageBuilder,
    newDocument,
    saveDocument,
  } = useEditorStore();

  const { toast } = useToast();

  const handleNew = useCallback(() => {
    const state = useEditorStore.getState();
    if (state.isModified) {
      const res = confirm("شما تغییرات ذخیره‌نشده دارید. آیا می‌خواهید ذخیره کنید؟ (OK برای ذخیره، Cancel برای رد کردن)");
      if (res) {
        handleSave();
      } else {
        state.clearAutosave();
      }
    }
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

        const parsed = parseMarkdownFile(text);
        if (parsed.pageSettings) {
          useEditorStore.getState().setPageSettings(parsed.pageSettings);
        }
        useEditorStore.getState().setContent(parsed.content);

        const state = useEditorStore.getState();
        parsed.images.forEach((img) => {
          if (!state.blocks.find((b) => b.id === img.id)) {
            state.addBlock({ id: img.id, type: 'image', src: img.src, settings: { width: 400, height: undefined, x: 0, y: 0 } });
          }
        });

        toast({
          title: "File Opened",
          description: `Loaded: ${file.name}`,
        });
      }
    };
    input.click();
  }, [toast]);

  const handleIntro = useCallback(() => {
    useEditorStore.getState().toggleIntro();
  }, []);

  const handleSave = useCallback(async () => {
    // Try saving via File System Access API first; otherwise fallback to download (Save As)
    const doc = saveDocument();
    const meta = `<!--PAGE_SETTINGS:${JSON.stringify(pageSettings)}-->`;
    const imageMd = blocks
      .filter((b) => b.type === "image")
      .map((b) => `\n\n![image-${b.id}](${b.src})`)
      .join("");
    const final = `${meta}\n\n${content}${imageMd}`;

    try {
      if ((window as any).showSaveFilePicker) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `${doc?.title || "document"}.md`,
          types: [{ description: "Markdown", accept: { "text/markdown": [".md", ".markdown", ".txt"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(final);
        await writable.close();
        useEditorStore.getState().clearAutosave();
        toast({ title: "Saved to disk", description: "File written to your device." });
        return;
      }
    } catch (err) {
      // fallthrough to Save As
    }

    // fallback: download
    handleSaveAs();
  }, [content, pageSettings, blocks, toast, saveDocument]);

  // Save only the raw markdown (no internal page meta) so it opens cleanly in other editors
  const handleSaveMarkdown = useCallback(async () => {
    const doc = saveDocument();
    const imageMd = blocks
      .filter((b) => b.type === "image")
      .map((b) => `\n\n![image-${b.id}](${b.src})`)
      .join("");
    const final = `${content}${imageMd}`;

    try {
      if ((window as any).showSaveFilePicker) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `${doc?.title || "document"}.md`,
          types: [{ description: "Markdown", accept: { "text/markdown": [".md", ".markdown", ".txt"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(final);
        await writable.close();
        useEditorStore.getState().clearAutosave();
        toast({ title: "Saved Markdown", description: "Markdown file saved to your device." });
        return;
      }
    } catch (err) {
      // fallthrough to download
    }

    // fallback: download raw markdown
    const blob = new Blob([final], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc?.title || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);

    useEditorStore.getState().clearAutosave();
    toast({ title: "Saved Markdown", description: "Markdown file downloaded." });
  }, [content, pageSettings, blocks, toast, saveDocument]);

  const handleSaveAs = useCallback(() => {
    const meta = `<!--PAGE_SETTINGS:${JSON.stringify(pageSettings)}-->`;
    const imageMd = blocks
      .filter((b) => b.type === "image")
      .map((b) => `\n\n![image-${b.id}](${b.src})`)
      .join("");
    const final = `${meta}\n\n${content}${imageMd}`;

    const blob = new Blob([final], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
    // clear autosave since user saved to disk
    useEditorStore.getState().clearAutosave();
    toast({
      title: "File Downloaded",
      description: "Markdown file has been downloaded.",
    });
  }, [content, pageSettings, blocks, toast]);

  const handleExportMarkdown = useCallback(() => {
    const meta = `<!--PAGE_SETTINGS:${JSON.stringify(pageSettings)}-->`;
    const imageMd = blocks
      .filter((b) => b.type === "image")
      .map((b) => `\n\n![image-${b.id}](${b.src})`)
      .join("");
    const final = `${meta}\n\n${content}${imageMd}`;

    const blob = new Blob([final], { type: "text/markdown" });
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
  }, [content, pageSettings, blocks, toast]);

  const handleExportHTML = useCallback(() => {
    const html = renderMarkdown(content, true);
    const blockHtml = blocks
        .map((block) => {
        if (block.type === "heading") {
          const Tag = `h${block.settings.level || 1}`;
          const blockFont = (block.settings.direction === 'rtl') ? (block.settings.fontFamilyFa || block.settings.fontFamily) : (block.settings.fontFamilyEn || block.settings.fontFamily);
          return `<${Tag} style="font-family: ${blockFont || 'Vazirmatn'}; font-size: ${block.settings.fontSize}px; color: ${block.settings.color}; background-color: ${block.settings.background}; font-weight: ${block.settings.bold ? 'bold' : 'normal'}; font-style: ${block.settings.italic ? 'italic' : 'normal'}; text-align: ${block.settings.alignment || 'left'};">${block.content}</${Tag}>`;
        }
        if (block.type === "paragraph") {
          const paraFont = (block.settings.direction === 'rtl') ? (block.settings.fontFamilyFa || block.settings.fontFamily) : (block.settings.fontFamilyEn || block.settings.fontFamily);
          return `<p style="font-family: ${paraFont || 'Vazirmatn'}; font-size: ${block.settings.fontSize}px; color: ${block.settings.color}; background-color: ${block.settings.background}; font-weight: ${block.settings.bold ? 'bold' : 'normal'}; font-style: ${block.settings.italic ? 'italic' : 'normal'}; text-align: ${block.settings.alignment || 'left'};">${block.content}</p>`;
        }
        if (block.type === "image") {
          const w = block.settings.width ? `${block.settings.width}px` : 'auto';
          const h = block.settings.height ? `${block.settings.height}px` : 'auto';
          return `<div class="image-block" data-block-id="${block.id}" style="width: ${w}; height: ${h}; display:inline-block;"><img src="${block.src}" style="width:100%; height:100%; object-fit:contain;"/></div>`;
        }
        return '';
      })
      .join("\n");

    const fontFaces = uploadedFonts
      .map((f) => `@font-face { font-family: '${f.family || f.name}'; src: url('${f.url}'); font-display: swap; }`)
      .join("\n");

    const padding = `${pageSettings.marginTop}px ${pageSettings.marginRight}px ${pageSettings.marginBottom}px ${pageSettings.marginLeft}px`;

    const borderTop = pageSettings.border?.sides.includes('top') ? `${pageSettings.border.width}px ${pageSettings.border.style} ${pageSettings.border.color}` : 'none';
    const borderBottom = pageSettings.border?.sides.includes('bottom') ? `${pageSettings.border.width}px ${pageSettings.border.style} ${pageSettings.border.color}` : 'none';
    const borderLeft = pageSettings.border?.sides.includes('left') ? `${pageSettings.border.width}px ${pageSettings.border.style} ${pageSettings.border.color}` : 'none';
    const borderRight = pageSettings.border?.sides.includes('right') ? `${pageSettings.border.width}px ${pageSettings.border.style} ${pageSettings.border.color}` : 'none';

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Document</title>
  <style>
    ${fontFaces}
    body {
      font-family: '${pageSettings.fontFamilyEn || pageSettings.fontFamily}', '${pageSettings.fontFamilyFa || 'Vazirmatn'}', system-ui, sans-serif;
      font-size: ${pageSettings.fontSize}px;
      line-height: ${pageSettings.lineHeight};
      color: ${pageSettings.color};
      background: ${pageSettings.background || '#ffffff'};
    }
    #page { max-width: 800px; margin: 0 auto; padding: ${padding}; box-sizing: border-box; border-top: ${borderTop}; border-bottom: ${borderBottom}; border-left: ${borderLeft}; border-right: ${borderRight}; }
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
    .image-block img { max-width: 100%; height: auto; border-radius: 8px; }
  </style>
</head>
<body>
  <!--ORIGINAL_MARKDOWN_BASE64:${btoa(unescape(encodeURIComponent(content)))}-->
  <div id="page">
    ${html}
    ${blockHtml}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${useEditorStore.getState().currentDocument?.title || 'document'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: "HTML file exported successfully.",
    });
  }, [content, pageSettings, blocks, uploadedFonts, toast]);

  // Save Page (rendered HTML with embedded original markdown)
  const handleSavePage = useCallback(() => {
    // alias to exportHTML which already embeds original markdown via comment
    handleExportHTML();
  }, [handleExportHTML]);

  const handleExportPDF = useCallback(async () => {
    toast({
      title: "Generating PDF",
      description: "Please wait while we generate your PDF...",
    });

    try {
      const html = renderMarkdown(content, true);

      const blockHtml = blocks
          .map((block) => {
          if (block.type === "heading") {
            const Tag = `h${block.settings.level || 1}`;
            const blockFont = (block.settings.direction === 'rtl') ? (block.settings.fontFamilyFa || block.settings.fontFamily) : (block.settings.fontFamilyEn || block.settings.fontFamily);
            return `<${Tag} style="font-family: ${blockFont || 'Vazirmatn'}; font-size: ${block.settings.fontSize}px; color: ${block.settings.color}; background-color: ${block.settings.background}; font-weight: ${block.settings.bold ? 'bold' : 'normal'}; font-style: ${block.settings.italic ? 'italic' : 'normal'}; text-align: ${block.settings.alignment || 'left'};">${block.content}</${Tag}>`;
          }
          if (block.type === "paragraph") {
            const paraFont = (block.settings.direction === 'rtl') ? (block.settings.fontFamilyFa || block.settings.fontFamily) : (block.settings.fontFamilyEn || block.settings.fontFamily);
            return `<p style="font-family: ${paraFont || 'Vazirmatn'}; font-size: ${block.settings.fontSize}px; color: ${block.settings.color}; background-color: ${block.settings.background}; font-weight: ${block.settings.bold ? 'bold' : 'normal'}; font-style: ${block.settings.italic ? 'italic' : 'normal'}; text-align: ${block.settings.alignment || 'left'};">${block.content}</p>`;
          }
          if (block.type === "image") {
            const w = block.settings.width ? `${block.settings.width}px` : 'auto';
            const h = block.settings.height ? `${block.settings.height}px` : 'auto';
            return `<div class="image-block" data-block-id="${block.id}" style="width: ${w}; height: ${h}; display:inline-block;"><img src="${block.src}" style="width:100%; height:100%; object-fit:contain;"/></div>`;
          }
          return '';
        })
        .join("\n");

      const fontFaces = uploadedFonts
        .map((f) => `@font-face { font-family: '${f.family || f.name}'; src: url('${f.url}'); font-display: swap; }`)
        .join("\n");

      const container = document.createElement("div");

      const padding = `${pageSettings.marginTop}px ${pageSettings.marginRight}px ${pageSettings.marginBottom}px ${pageSettings.marginLeft}px`;
      const borderTop = pageSettings.border?.sides.includes('top') ? `${pageSettings.border.width}px ${pageSettings.border.style} ${pageSettings.border.color}` : 'none';
      const borderBottom = pageSettings.border?.sides.includes('bottom') ? `${pageSettings.border.width}px ${pageSettings.border.style} ${pageSettings.border.color}` : 'none';
      const borderLeft = pageSettings.border?.sides.includes('left') ? `${pageSettings.border.width}px ${pageSettings.border.style} ${pageSettings.border.color}` : 'none';
      const borderRight = pageSettings.border?.sides.includes('right') ? `${pageSettings.border.width}px ${pageSettings.border.style} ${pageSettings.border.color}` : 'none';

      container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        padding: 0;
        background: ${pageSettings.background || 'white'};
        font-family: '${pageSettings.fontFamilyEn || pageSettings.fontFamily}', '${pageSettings.fontFamilyFa || 'Vazirmatn'}', system-ui, sans-serif;
        line-height: ${pageSettings.lineHeight};
        color: ${pageSettings.color};
      `;

      container.innerHTML = `
        <style>
          ${fontFaces}
          #page { max-width: 800px; margin: 0 auto; padding: ${padding}; box-sizing: border-box; border-top: ${borderTop}; border-bottom: ${borderBottom}; border-left: ${borderLeft}; border-right: ${borderRight}; }
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
          .image-block img { max-width: 100%; height: auto; border-radius: 8px; }
        </style>
        <div id="page">
          ${html}
          ${blockHtml}
        </div>
      `;

      document.body.appendChild(container);

      // Try to ensure uploaded fonts are loaded before rendering.
      try {
        await Promise.all(uploadedFonts.map(f => (document as any).fonts.load(`1em '${f.family || f.name}'`)));
        await (document as any).fonts.ready;
      } catch {}

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
            <DropdownMenuItem onClick={handleIntro} data-testid="menu-file-intro">
              <FileText className="mr-2 h-4 w-4" />
              Introduction
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSavePage} data-testid="menu-file-save-page">
              <FileText className="mr-2 h-4 w-4" />
              Save Page
              <DropdownMenuShortcut>Ctrl+Shift+P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSaveMarkdown} data-testid="menu-file-save-md">
              <FileText className="mr-2 h-4 w-4" />
              Save Markdown
              <DropdownMenuShortcut>Ctrl+Alt+S</DropdownMenuShortcut>
            </DropdownMenuItem>
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
            <DropdownMenuItem onClick={togglePageSettings} data-testid="menu-tools-page-settings">
              <FileText className="mr-2 h-4 w-4" />
              Page Settings
            </DropdownMenuItem>
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
