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

export interface SessionDetail {
  id: string;
  athlete_id: string;
  title: string;
  type: string;
  sport: string;
  description: string | null;
  status: string;
  started_at: string;
}

export interface Athlete {
  id: string;
  name: string;
  sport: string;
  metadata: Record<string, unknown>;
}

export interface AthleteListResponse {
  athletes: Athlete[];
}

export interface Invite {
  code: string;
  expires_at: string | null;
  max_uses: number;
  uses: number;
  created_at: string | null;
}

export interface InviteListResponse {
  invites: Invite[];
}

export interface CreateInviteResponse {
  code: string;
  expires_at: string | null;
  max_uses: number;
}

export interface MemoryStats {
  operations: Record<string, number>;
  cognee_dataset: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  athlete_id: string | null;
}
