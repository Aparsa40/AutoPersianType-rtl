import { useState } from "react";
import { useEditorStore } from "@/lib/store";
import type { Block } from "@/lib/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function HeadingBuilder() {
  const { showHeadingBuilder, toggleHeadingBuilder, addBlock } = useEditorStore();

  const [text, setText] = useState("Welcome to AutoPersian Type Pro");
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState("#ffffff");
  const [background, setBackground] = useState("#2205ff");
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("left");

  if (!showHeadingBuilder) return null;

  const handleApply = () => {
    const block: Block = {
      id: crypto.randomUUID(),
      type: "heading",
      content: text,
      settings: {
        level,
        fontSize,
        color,
        background,
        bold,
        italic,
        alignment,
        border: {
          sides: ["top", "bottom"],
          width: 5,
          style: "solid",
          color: "#000000",
        },
      },
    };

    addBlock(block);
    toggleHeadingBuilder();
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold">Heading Builder</h3>

      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Heading text"
      />

      <div className="flex gap-2">
        <Select value={String(level)} onValueChange={(v) => setLevel(Number(v) as any)}>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
        </Select>

        <Input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          placeholder="Font size"
        />

        <Select value={alignment} onValueChange={(v) => setAlignment(v as any)}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Select>
      </div>

      <div className="flex gap-2">
        <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <Input type="color" value={background} onChange={(e) => setBackground(e.target.value)} />
      </div>

      <div className="flex gap-4 text-sm">
        <label>
          <input type="checkbox" checked={bold} onChange={() => setBold(!bold)} /> Bold
        </label>
        <label>
          <input type="checkbox" checked={italic} onChange={() => setItalic(!italic)} /> Italic
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={toggleHeadingBuilder}>
          Cancel
        </Button>
        <Button onClick={handleApply}>Apply</Button>
      </div>
    </div>
  );
}
