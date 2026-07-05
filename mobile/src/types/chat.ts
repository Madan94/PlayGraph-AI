import { MemorySource } from "@/api/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  memoriesUsed?: number;
  sources?: MemorySource[];
  failed?: boolean;
}
