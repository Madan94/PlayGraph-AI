import { Ionicons } from "@expo/vector-icons";

export type MemoryCategory = "injury" | "coach_note" | "performance" | "session";

export interface MemoryCategoryMeta {
  category: MemoryCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: "danger" | "purple" | "cyan" | "emerald";
}

const RULES: { test: RegExp; meta: Omit<MemoryCategoryMeta, "category"> }[] = [
  {
    test: /injur|hamstring|strain|sore|pain|tight/i,
    meta: { label: "Injury", icon: "medkit-outline", colorKey: "danger" },
  },
  {
    test: /coach|noted|technique|drill|cover drive|position/i,
    meta: { label: "Coach Note", icon: "chatbox-ellipses-outline", colorKey: "purple" },
  },
  {
    test: /gps|sprint|hr|heart rate|km|distance|speed/i,
    meta: { label: "Performance", icon: "speedometer-outline", colorKey: "cyan" },
  },
];

export function categorizeMemory(summary: string): MemoryCategoryMeta {
  for (const rule of RULES) {
    if (rule.test.test(summary)) {
      return { category: rule.meta.label === "Injury" ? "injury" : rule.meta.label === "Coach Note" ? "coach_note" : "performance", ...rule.meta };
    }
  }
  return { category: "session", label: "Session", icon: "albums-outline", colorKey: "emerald" };
}
