import { Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SessionUploadHub } from "@/components/upload/session-upload-hub";

export default function CoachUploadPage() {
  return (
    <div className="app-page-sm space-y-8">
      <PageHeader
        icon={Upload}
        title="Upload Session"
        description="Add video, images, audio, wearable JSON, or coach notes to athlete memory."
      />
      <SessionUploadHub role="coach" />
    </div>
  );
}
