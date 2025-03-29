import { Capture, Screen } from "@prisma/client";
import { TraceFormData } from "../page";
import { createTrace, generatePresignedScreenUpload } from "@/lib/actions";
import { toast } from "sonner";

export async function handleSave(data: TraceFormData, capture: Capture) {
  // Transpose gestures on to screens
  let screens = data.screens.map((screen) => {
    return {
      created: new Date(),
      gesture: data.gestures[screen.id],
      src: "",
      vh: "",
    };
  }) as Screen[];

  // Upload B64 images to S3 using presigned uploads
  const generateScreenUploadRes = await Promise.all(
    screens.map((_) => {
      return generatePresignedScreenUpload(capture.id, "image/png");
    })
  );

  if (
    !generateScreenUploadRes ||
    generateScreenUploadRes.some((res) => !res.ok)
  ) {
    toast.error(
      "Failed to upload screen images: Failed to generate presigned URLs."
    );
    return;
  }

  const screenUploadRes = await Promise.all(
    data.screens.map(async (screen, index) => {
      var res;

      if (generateScreenUploadRes[index].ok) {
        res = await fetch(generateScreenUploadRes[index].data.uploadUrl, {
          method: "PUT",
          body: Buffer.from(
            screen.url.split("data:image/png;base64,")[1],
            "base64"
          ),
          headers: { "Content-Type": "image/png" },
        });

        if (!res.ok) {
          toast.error("Failed to upload screen images.");
          return { ok: false, message: "Failed to upload screen images." };
        }

        // Set screen src to S3 URL
        screens[index].src = generateScreenUploadRes[index].data.fileUrl;

        return generateScreenUploadRes[index];
      }
    })
  );

  if (!screenUploadRes || screenUploadRes.some((res) => !res!.ok)) {
    toast.error("Failed to upload screen images.");
    return;
  }

  // Create trace AND screen records
  const trace = await createTrace(
    {
      name: "New Trace",
      description: data.description,
      created: new Date(),
      appId: capture!.appId_!,
      screens: {
        create: [...screens],
      },
      worker: "web",
    },
    {
      includes: { screens: true },
    }
  );

  if (!trace.ok) {
    toast.error("Failed to create trace.");
    return;
  }

  toast.success("Trace created successfully.");
}
