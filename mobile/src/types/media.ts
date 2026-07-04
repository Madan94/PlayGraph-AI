import { AssetType } from "@/api/types";

export interface SelectedMedia {
  uri: string;
  assetType: AssetType;
  mimeType: string;
  label: string;
}
