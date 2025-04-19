import { Capture, Screen } from "@prisma/client";
import { FrameData, TraceFormData } from "../components/types";
import {
  createTrace,
  generatePresignedScreenUpload,
  generatePresignedVHUpload,
} from "@/lib/actions";
import { toast } from "sonner";
import { GestureOption } from "../components/types";
import { createContext } from "react";
import { ActionPayload } from "@/lib/actions/types";

export const GestureOptionsContext = createContext<{
  gestureOptions: GestureOption[];
}>({
  gestureOptions: [],
});

export async function handleSave(data: TraceFormData, capture: Capture) {
  console.log("save trace");
  // Transpose gestures on to screens
  let screens = data.screens.map((screen: FrameData) => {
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
    return Promise.reject(
      "Failed to upload screen images: Failed to generate presigned URLs."
    );
  }

  const screenUploadRes = await Promise.all(
    data.screens.map(async (screen: FrameData, index: number) => {
      var res;

      if (generateScreenUploadRes[index].ok) {
        res = await fetch(generateScreenUploadRes[index].data.uploadUrl, {
          method: "PUT",
          body: Buffer.from(
            screen.src.split("data:image/png;base64,")[1],
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
    return Promise.reject("Failed to upload screen images.");
  }

  // check if there are view hierarchies, if so then upload them
  const vhs = data.vhs;
  if (vhs && Object.keys(vhs).length > 0) {
    const generateVHUploadRes = await Promise.all(
      screens.map((_) => {
        return generatePresignedVHUpload(capture.id, "application/json");
      })
    );

    if (!generateVHUploadRes || generateVHUploadRes.some((res) => !res.ok)) {
      toast.error(
        "Failed to upload screen images: Failed to generate presigned URLs."
      );
      return Promise.reject(
        "Failed to upload screen images: Failed to generate presigned URLs."
      );
    }

    const vhUploadRes = await Promise.all(
      data.screens.map(async (screen: FrameData, index: number) => {
        var res;
        const vh = vhs[screen.id];
        if (!vh) {
          return { ok: false, message: "Failed to find view hierarchies." };
        }
        if (generateVHUploadRes[index].ok) {
          res = await fetch(generateVHUploadRes[index].data.uploadUrl, {
            method: "PUT",
            body: JSON.stringify(vh),
            headers: { "Content-Type": "application/json" },
          });

          if (!res.ok) {
            toast.error("Failed to upload view hierarchies.");
            return { ok: false, message: "Failed to upload view hierarchies." };
          }

          // Set screen src to S3 URL
          screens[index].vh = generateVHUploadRes[index].data.fileUrl;

          return generateVHUploadRes[index];
        }
      })
    );

    if (
      !vhUploadRes ||
      vhUploadRes.some((res) => !res!.ok)
    ) {
      toast.error("Failed to upload screen view hierarchies.");
      return Promise.reject("Failed to upload screen view hierarchies.");
    }
  }

  // Create trace AND screen records
  console.log(capture);
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
    return Promise.reject("Failed to create trace.");
  }

  toast.success("Trace created successfully.");
}
