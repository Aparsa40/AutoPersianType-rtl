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
  // legacy single fontFamily; prefer language-specific fields below
  fontFamily?: string;
  fontFamilyFa?: string;
  fontFamilyEn?: string;
  fontSize?: number;
  alignment?: "left" | "center" | "right";
  // text direction for the block (used to choose language-specific fonts)
  direction?: "ltr" | "rtl" | "mixed";

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
