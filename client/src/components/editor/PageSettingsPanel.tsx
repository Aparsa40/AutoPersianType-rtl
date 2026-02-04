import { useRef, useEffect, useState } from "react";
import { X, Upload, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/lib/store";
import { fontFamilies } from "@shared/schema";

export function PageSettingsPanel() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const {
    showPageSettings,
    togglePageSettings,
    pageSettings,
    setPageSettings,
    uploadedFonts,
    addUploadedFont,
    removeUploadedFont,
    content,
    selectionRange,
    updateBlock,
    addBlock,
    setContent,
    setIsModified,
  } = useEditorStore();

  const [local, setLocal] = useState(pageSettings);

  useEffect(() => setLocal(pageSettings), [pageSettings]);

  // compute selected text for preview
  const selectedText = (() => {
    try {
      if (!content) return "";
      const lines = content.split('\n');
      if (selectionRange && selectionRange.startLine) {
        const s = Math.max(0, selectionRange.startLine - 1);
        const e = Math.max(0, selectionRange.endLine - 1);
        return lines.slice(s, e + 1).join('\n');
      }
      return "";
    } catch {
      return "";
    }
  })();

  // register uploaded fonts as @font-face rules so they can be used in preview
  useEffect(() => {
    const id = "_user_fonts_style";
    let styleEl = document.getElementById(id) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }

    const rules = uploadedFonts
      .map((f) => {
        const family = f.family || f.name.replace(/\.[^/.]+$/, "");
        return `@font-face { font-family: '${family}'; src: url('${f.url}'); font-display: swap; }`;
      })
      .join("\n");

    styleEl.textContent = rules;
    return () => {
      // keep the style updated; don't remove on unmount so fonts persist
    };
  }, [uploadedFonts]);

  const openFile = () => fileRef.current?.click();
  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const id = crypto.randomUUID();
      const family = `${file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")}_${id.slice(0,8)}`;
      addUploadedFont({ id, name: file.name, family, url });
    };
    reader.readAsDataURL(file);
  };

  const onUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyLocal = () => {
    // apply local page settings as global fallback (keeps previous behavior)
    setPageSettings(local);
  };

  const reset = () => {
    setLocal({
      fontFamily: "Vazirmatn",
      fontFamilyFa: "Vazirmatn",
      fontFamilyEn: "Inter",
      fontSize: 16,
      color: "#1a1a1a",
      background: "#ffffff",
      lineHeight: 1.7,
      marginTop: 40,
      marginBottom: 40,
      marginLeft: 40,
      marginRight: 40,
      border: null,
    });
    setPageSettings({
      fontFamily: "Vazirmatn",
      fontFamilyFa: "Vazirmatn",
      fontFamilyEn: "Inter",
      fontSize: 16,
      color: "#1a1a1a",
      background: "#ffffff",
      lineHeight: 1.7,
      marginTop: 40,
      marginBottom: 40,
      marginLeft: 40,
      marginRight: 40,
      border: null,
    });
  };

  const findBlockIdAtLine = (lines: string[], idx: number) => {
    const searchUp = 5;
    for (let i = idx; i >= Math.max(0, idx - searchUp); i--) {
      const m = lines[i]?.match(/<!--BLOCK_ID:([a-f0-9-]+)-->/i);
      if (m) return m[1];
    }
    for (let i = idx + 1; i <= Math.min(lines.length - 1, idx + searchUp); i++) {
      const m = lines[i]?.match(/<!--BLOCK_ID:([a-f0-9-]+)-->/i);
      if (m) return m[1];
    }
    return null;
  };

  // Page settings should apply to the whole document. We no longer create
  // selection-mapped blocks or inject HTML comments. This keeps the editor
  // DOM stable and prevents wrapping selected text.
  const applyToSelectionOrGlobal = (partial: Partial<typeof pageSettings>) => {
    setPageSettings(partial);
  };

  const ensureBorder = () => pageSettings.border || { sides: ['top','right','bottom','left'], width: 1, style: 'solid', color: '#000000' };

  // currentBorder is a safe object we can use in JSX to avoid optional chaining warnings
  const currentBorder = pageSettings.border || { sides: [], width: 0, style: 'solid', color: '#000000' };

  const toggleBorderSide = (side: 'top' | 'right' | 'bottom' | 'left') => {
    const base = ensureBorder();
    const sides = base.sides.includes(side) ? base.sides.filter(s => s !== side) : [...base.sides, side];
    setPageSettings({ border: { ...base, sides } });
  };

  const setBorderWidth = (width: number) => {
    const base = ensureBorder();
    setPageSettings({ border: { ...base, width } });
  };

  const setBorderStyle = (style: 'solid' | 'dashed' | 'dotted') => {
    const base = ensureBorder();
    setPageSettings({ border: { ...base, style } });
  };

  const setBorderColor = (color: string) => {
    const base = ensureBorder();
    setPageSettings({ border: { ...base, color } });
  };

  return (
    <Sheet open={showPageSettings} onOpenChange={togglePageSettings}>
      <SheetContent className="w-[480px] sm:max-w-[480px] max-h-[90vh] overflow-y-auto" data-testid="page-settings-panel">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold">Page Settings</SheetTitle>
              <SheetDescription>Customize page appearance for live preview and exports</SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={onUploadChange} />
              <Button variant="ghost" size="sm" onClick={openFile}>
                <Upload className="mr-2 h-4 w-4" /> Upload Font
              </Button>
              <Button variant="ghost" onClick={togglePageSettings}><X /></Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wide">Typography</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="page-font-fa">Font Family (فارسی)</Label>
                  <Select value={pageSettings.fontFamilyFa || pageSettings.fontFamily} onValueChange={(value) => applyToSelectionOrGlobal({ fontFamilyFa: value })}>
                    <SelectTrigger id="page-font-fa">
                      <SelectValue placeholder="Select Persian font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                      {uploadedFonts.map((f) => (
                        <SelectItem key={f.id} value={f.family || f.name}>
                          <span style={{ fontFamily: f.family || f.name }}>{f.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="page-font-en">Font Family (English)</Label>
                  <Select value={pageSettings.fontFamilyEn || pageSettings.fontFamily} onValueChange={(value) => applyToSelectionOrGlobal({ fontFamilyEn: value })}>
                    <SelectTrigger id="page-font-en">
                      <SelectValue placeholder="Select English font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                      {uploadedFonts.map((f) => (
                        <SelectItem key={f.id} value={f.family || f.name}>
                          <span style={{ fontFamily: f.family || f.name }}>{f.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="page-font-size">Font Size</Label>
                  <span className="text-sm text-muted-foreground">{pageSettings.fontSize}px</span>
                </div>
                <Slider id="page-font-size" min={8} max={48} step={1} value={[pageSettings.fontSize]} onValueChange={([value]) => applyToSelectionOrGlobal({ fontSize: value })} />
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Label htmlFor="page-color">Font Color</Label>
                  <Input id="page-color" type="color" value={pageSettings.color} onChange={(e) => applyToSelectionOrGlobal({ color: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Label htmlFor="page-bg">Background</Label>
                  <Input id="page-bg" type="color" value={pageSettings.background || "#ffffff"} onChange={(e) => applyToSelectionOrGlobal({ background: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Selection Preview</Label>
                <div className="mt-2 p-4 rounded border" style={{ background: local.background || 'transparent' }}>
                  <div className="flex gap-2 items-center mb-2">
                    <button className="btn px-2 py-1 border rounded" onClick={() => (window as any).wrapSelectionWith('**','**')}>Bold</button>
                    <button className="btn px-2 py-1 border rounded" onClick={() => (window as any).wrapSelectionWith('<u>','</u>')}>Underline</button>
                    <button className="btn px-2 py-1 border rounded" onClick={() => (window as any).wrapSelectionWith('*','*')}>Italic</button>
                  </div>
                  <div style={{
                    fontFamily: local.fontFamilyFa || local.fontFamily || 'Vazirmatn',
                    fontSize: `${local.fontSize || 16}px`,
                    color: local.color || '#000000',
                    textAlign: 'left',
                  }}>
                    {selectedText ? <div dangerouslySetInnerHTML={{ __html: selectedText.replace(/\n/g, '<br/>') }} /> : <div className="text-sm text-muted-foreground">No text selected</div>}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="page-line-height">Line Height</Label>
                  <span className="text-sm text-muted-foreground">{pageSettings.lineHeight.toFixed(1)}</span>
                </div>
                <Slider id="page-line-height" min={1} max={3} step={0.1} value={[pageSettings.lineHeight]} onValueChange={([value]) => setPageSettings({ lineHeight: value })} />
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wide">Layout</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="margin-top">Top Margin (px)</Label>
                <Input id="margin-top" type="number" value={String(pageSettings.marginTop)} onChange={(e) => setPageSettings({ marginTop: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="margin-bottom">Bottom Margin (px)</Label>
                <Input id="margin-bottom" type="number" value={String(pageSettings.marginBottom)} onChange={(e) => setPageSettings({ marginBottom: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="margin-left">Left Margin (px)</Label>
                <Input id="margin-left" type="number" value={String(pageSettings.marginLeft)} onChange={(e) => setPageSettings({ marginLeft: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="margin-right">Right Margin (px)</Label>
                <Input id="margin-right" type="number" value={String(pageSettings.marginRight)} onChange={(e) => setPageSettings({ marginRight: Number(e.target.value) })} />
              </div>
            </div>

            <div className="mt-4">
              <Label>Border</Label>
              <div className="flex gap-2 items-center mt-2">
                <div className="flex gap-1">
                  <button className={`px-2 py-1 border rounded ${currentBorder.sides.includes('top') ? 'bg-muted' : ''}`} onClick={() => toggleBorderSide('top')}>Top</button>
                  <button className={`px-2 py-1 border rounded ${currentBorder.sides.includes('right') ? 'bg-muted' : ''}`} onClick={() => toggleBorderSide('right')}>Right</button>
                  <button className={`px-2 py-1 border rounded ${currentBorder.sides.includes('bottom') ? 'bg-muted' : ''}`} onClick={() => toggleBorderSide('bottom')}>Bottom</button>
                  <button className={`px-2 py-1 border rounded ${currentBorder.sides.includes('left') ? 'bg-muted' : ''}`} onClick={() => toggleBorderSide('left')}>Left</button>
                </div>

                <div className="flex-1">
                  <Label htmlFor="border-width">Border Width</Label>
                  <Slider id="border-width" min={0} max={12} step={1} value={[currentBorder.width || 0]} onValueChange={([value]) => setBorderWidth(value)} />
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <div className="flex-1">
                  <Label htmlFor="border-style">Border Style</Label>
                  <Select value={currentBorder.style || 'solid'} onValueChange={(value) => setBorderStyle(value as any)}>
                    <SelectTrigger id="border-style">
                      <SelectValue placeholder="Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor="border-color">Border Color</Label>
                  <Input id="border-color" type="color" value={currentBorder.color || '#000000'} onChange={(e) => setBorderColor(e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wide">Uploaded Fonts</h3>
            <div className="space-y-2">
              {uploadedFonts.length === 0 && <div className="text-sm text-muted-foreground">No uploaded fonts yet.</div>}
              {uploadedFonts.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-2">
                  <div style={{ fontFamily: f.family || f.name }}>{f.name}</div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => applyToSelectionOrGlobal({ fontFamilyFa: f.family || f.name })}>Use (فارسی)</Button>
                    <Button variant="ghost" size="sm" onClick={() => applyToSelectionOrGlobal({ fontFamilyEn: f.family || f.name })}>Use (EN)</Button>
                    <Button variant="ghost" size="sm" onClick={() => removeUploadedFont(f.id)}><Trash /></Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={reset}>Reset</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={togglePageSettings}>Close</Button>
              <Button onClick={() => { applyLocal(); togglePageSettings(); }}>Apply</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
