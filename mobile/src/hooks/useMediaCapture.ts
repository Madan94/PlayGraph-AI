import * as ImagePicker from "expo-image-picker";
import { useToast } from "@/context/ToastContext";
import { AssetType } from "@/api/types";
import { SelectedMedia } from "@/types/media";

export function useMediaCapture() {
  const toast = useToast();

  async function pickFromGallery(): Promise<SelectedMedia | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.show("Photo library permission is required", "error");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    const assetType: AssetType = asset.type === "video" ? "video" : "image";
    return {
      uri: asset.uri,
      assetType,
      mimeType: asset.mimeType ?? (assetType === "video" ? "video/mp4" : "image/jpeg"),
      label: asset.fileName ?? `Gallery ${assetType}`,
    };
  }

  async function captureFromCamera(mode: "photo" | "video"): Promise<SelectedMedia | null> {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.show("Camera permission is required", "error");
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mode === "video" ? ["videos"] : ["images"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    const assetType: AssetType = mode === "video" ? "video" : "image";
    return {
      uri: asset.uri,
      assetType,
      mimeType: asset.mimeType ?? (assetType === "video" ? "video/mp4" : "image/jpeg"),
      label: mode === "video" ? "Training clip (camera)" : "Photo (camera)",
    };
  }

  return { pickFromGallery, captureFromCamera };
}
