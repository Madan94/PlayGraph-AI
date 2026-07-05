export type UserRole = "athlete" | "coach" | "scout" | "admin";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  full_name: string | null;
}

export interface Session {
  email: string;
  token: string;
  role: UserRole;
  fullName: string | null;
}

export interface MemorySource {
  memory_id?: string;
  summary: string;
  session_id?: string;
}

export interface ChatResponse {
  answer: string;
  recall: {
    query: string;
    memories_used: number;
    sources: MemorySource[];
  };
}

export interface TimelineEntry {
  summary: string;
  memory_id?: string | null;
}

export interface TimelineResponse {
  athlete_id: string;
  entries: TimelineEntry[];
  memories_used: number;
}

export interface CreateSessionResponse {
  id: string;
  status: string;
}

export type AssetType = "video" | "audio" | "image" | "json" | "note";

export interface UploadAssetResponse {
  asset_id: string;
  job_id: string;
  status: string;
  topic: string;
}
