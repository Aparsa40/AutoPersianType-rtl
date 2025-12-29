import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import type { Block } from "@/lib/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ImageBuilder() {
  const { showImageBuilder, toggleImageBuilder, addBlock } = useEditorStore();
  const [src, setSrc] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(400);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      if (!height) setHeight(img.height);
      if (!width) setWidth(img.width);
    };
    img.src = src;
  }, [src]);

  if (!showImageBuilder) return null;

  const openFile = () => fileInputRef.current?.click();

  const onFile = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const handleApply = () => {
    if (!src) return;
    const block: Block = {
      id: crypto.randomUUID(),
      type: "image",
      src,
      settings: {
        width: width,
        height: height,
        x: 0,
        y: 0,
      },
    };
    addBlock(block);
    toggleImageBuilder();
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold">Insert Image</h3>

      <div
        className="border-dashed border-2 border-muted rounded p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        role="button"
      >
        <p className="text-sm">Drag & drop an image here or</p>
        <div className="mt-3">
          <Button onClick={openFile}>Select Image</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {src && (
        <div className="space-y-2">
          <img src={src} alt="preview" style={{ maxWidth: 300 }} />
          <div className="flex gap-2">
            <Input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            <Input type="number" value={height ?? 0} onChange={(e) => setHeight(Number(e.target.value))} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={toggleImageBuilder}>Cancel</Button>
        <Button onClick={handleApply}>Apply</Button>
      </div>
    </div>
  );
}
