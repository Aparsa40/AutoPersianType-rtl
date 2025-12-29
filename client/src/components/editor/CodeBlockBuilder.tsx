import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useEditorStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import type { Block } from "@/lib/blocks";

export function CodeBlockBuilder() {
  const { showCodeBlockBuilder, toggleCodeBlockBuilder, addBlock } = useEditorStore();
  const { toast } = useToast();

  const [language, setLanguage] = useState<string>("javascript");
  const [font, setFont] = useState<string>("'JetBrains Mono', monospace");
  const [fontSize, setFontSize] = useState<number>(14);
  const [placeholder, setPlaceholder] = useState<string>("// Your code here");

  const languages = [
    "plaintext", "javascript", "typescript", "python", "bash", "json", "html", "css"
  ];

  const fonts = [
    { name: "JetBrains Mono", css: "'JetBrains Mono', monospace" },
    { name: "Fira Code", css: "'Fira Code', monospace" },
    { name: "System Mono", css: "monospace" },
  ];

  const handleInsert = useCallback(() => {
    const block: Block = {
      id: crypto.randomUUID(),
      type: "code",
      content: placeholder,
      settings: {
        fontFamily: font,
        fontSize,
        language,
      },
    };

    addBlock(block);
    toggleCodeBlockBuilder();
    toast({ title: "Code Block Added", description: `Inserted a ${language} code block.` });
  }, [font, fontSize, language, placeholder, addBlock, toggleCodeBlockBuilder, toast]);

  return (
    <Dialog open={showCodeBlockBuilder} onOpenChange={toggleCodeBlockBuilder}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Insert Code Block</DialogTitle>
          <DialogDescription>Define language, font, and font size for this code block.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v)}>
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font">Font</Label>
              <Select value={font} onValueChange={(v) => setFont(v)}>
                {fonts.map(f => <option key={f.name} value={f.css}>{f.name}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Font Size</Label>
              <Input type="number" min={10} max={32} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-3 -mx-6 px-6 border-t">
          <Button variant="outline" onClick={toggleCodeBlockBuilder}>Cancel</Button>
          <Button onClick={handleInsert}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
