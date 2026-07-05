import { Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SessionUploadHub } from "@/components/upload/session-upload-hub";

export default function AthleteUploadPage() {
  return (
    <div className="app-page-sm space-y-8">
      <PageHeader
        icon={Upload}
        title="Upload Session"
        description="Share training video, images, audio, data, or session notes with your coach."
      />
      <SessionUploadHub role="athlete" />
    </div>
  );
}
