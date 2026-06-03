export type GenerationLayoutKind =
  | "cover"
  | "general"
  | "bullets"
  | "cards"
  | "metrics"
  | "chart"
  | "table"
  | "timeline"
  | "quote"
  | "team"
  | "visual"
  | "closing";

export type GenerationLayoutMetadata = {
  layoutId: string;
  slideIndex: number;
  layoutName: string;
  layoutDescription: string;
  semanticKind: GenerationLayoutKind;
  schemaFields: string[];
};
