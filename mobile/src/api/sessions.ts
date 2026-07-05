import { FileSystemUploadType, createUploadTask } from "expo-file-system/legacy";
import { API_URL } from "@/config/env";
import { api } from "./client";
import { getAuthToken } from "./tokenStore";
import { AssetType, CreateSessionResponse, SessionDetail, UploadAssetResponse } from "./types";

export const sessionsApi = {
  create: (athlete_id: string, title: string, type = "training", sport = "cricket") =>
    api<CreateSessionResponse>("/api/v1/sessions", {
      method: "POST",
      body: JSON.stringify({ athlete_id, title, type, sport }),
    }),

  get: (sessionId: string) =>
    api<SessionDetail>(`/api/v1/sessions/${sessionId}`),

  uploadAsset: async (
    sessionId: string,
    fileUri: string,
    assetType: AssetType,
    mimeType: string,
    onProgress?: (fraction: number) => void
  ): Promise<UploadAssetResponse> => {
    const token = getAuthToken();
    const task = createUploadTask(
      `${API_URL}/api/v1/sessions/${sessionId}/assets`,
      fileUri,
      {
        uploadType: FileSystemUploadType.MULTIPART,
        fieldName: "file",
        mimeType,
        parameters: { asset_type: assetType },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
      ({ totalBytesSent, totalBytesExpectedToSend }) => {
        if (totalBytesExpectedToSend > 0) onProgress?.(totalBytesSent / totalBytesExpectedToSend);
      }
    );

    const result = await task.uploadAsync();
    if (!result || result.status >= 400) {
      throw new Error(`Upload failed (${result?.status ?? "network error"})`);
    }
    return JSON.parse(result.body);
  },
};
