import { useAuthCheck } from "@/lib/hooks";
import { use } from "react";

export default async function CaptureNewPage() {
  useAuthCheck("/capture/new");

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Capture Task</h1>
      {/* Your form will go here next */}
    </div>
  );
}
