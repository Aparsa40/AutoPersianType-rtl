// lib/blocks.ts

export type BlockType =
  | "paragraph"
  | "heading"
  | "code"
  | "image";

export interface BorderSettings {
  sides: ("top" | "right" | "bottom" | "left")[];
  width: number;
  style: "solid" | "dashed" | "dotted";
  color: string;
}

export interface BlockSettings {
  fontFamily?: string;
  fontSize?: number;
  alignment?: "left" | "center" | "right";

  /* heading */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: string;
  background?: string;
  bold?: boolean;
  italic?: boolean;
  border?: BorderSettings;

  /* code */
  language?: string;

  /* image */
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  backgroundRemoved?: boolean;
}

export interface Block {
  id: string;
  type: BlockType;
  content?: string;
  src?: string;
  settings: BlockSettings;
}
