"use client";
import {
  Capture,
  Screen,
  ScreenGesture,
  ScreenRedaction,
  Trace,
} from "@prisma/client";
import { TraceFormData } from "../components/types";
import {
  createTrace,
  generatePresignedVHUpload,
  updateScreen,
  updateTrace,
} from "@/lib/actions";
import { toast } from "sonner";
import Konva from "konva";
import { Redaction } from "../components/types";
import { uploadToS3 } from "@/lib/aws/s3/client";
import { DateTime } from "luxon";

export async function exportRedactedImage(
  redactions: Redaction[],
  image_src: string
) {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => {
      resolve();
    };
    image.onerror = (err) => {
      console.error("Error loading image:", err);
      reject(new Error("Failed to load image"));
    };
    image.src = image_src;
  });

  if (!image.complete) {
    toast.error("Failed to load image.");
    return null;
  }

  // NOW it's guaranteed to be fully loaded
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.zIndex = "-9999";
  container.style.width = `${image.width}px`;
  container.style.height = `${image.height}px`;
  container.style.backgroundImage = `url(${image.src})`;
  document.body.appendChild(container);

  // create Konva Stage, etc...
  document.body.appendChild(container);

  // create new canvas
  var renderStage = new Konva.Stage({
    container: container,
    width: image.width,
    height: image.height,
  });

  // create new layer
  const renderLayer = new Konva.Layer();
  renderStage.add(renderLayer);

  // create new image with original resolution
  const renderImage = new Konva.Image({
    image: image,
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  renderLayer.add(renderImage);

  // render redactions
  redactions.forEach((redaction) => {
    const rect = new Konva.Rect({
      x: redaction.x * image.width,
      y: redaction.y * image.height,
      width: redaction.width * image.width,
      height: redaction.height * image.height,
      fill: "black",
      opacity: 1,
    });
    renderLayer.add(rect);
  });
  renderLayer.batchDraw();

  // export the canvas to data URL
  const dataURL = renderStage.toDataURL({
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
    pixelRatio: 1,
    mimeType: "image/png",
  });

  // delete the container
  document.body.removeChild(container);

  return dataURL;
}

export async function handleSave(data: TraceFormData, trace: Trace) {
  // Transpose gestures on to screens
  let screens = data.screens.map((screen: Screen) => {
    const gesture = data.gestures[screen.id] ?? {
      type: null,
      x: null,
      y: null,
      scrollDeltaX: null,
      scrollDeltaY: null,
      description: null,
    };
    const redactions = data.redactions[screen.id] ?? [];
    return {
      id: screen.id,
      src: screen.src,
      vh: "",
      created: new Date(),
      gesture,
      redactions: redactions,
    };
  });

  //  Update gestures
  const updateScreenRes = await Promise.all(
    screens.map(
      async (
        screen: Partial<Screen> & {
          id: string;
          gesture: ScreenGesture;
          redactions: ScreenRedaction[];
        }
      ) => {
        const redactionWithoutId = screen.redactions.map((redaction) => {
          // @ts-ignore
          const { id, ...rest } = redaction;
          return rest;
        });

        const res = await updateScreen(screen.id, {
          gesture: screen.gesture,
          redactions: redactionWithoutId,
        });

        console.log("Update screen response", res);

        return res;
      }
    )
  );

  // Check if all updates were successful
  if (updateScreenRes.some((res) => res.ok === false || res.data === null)) {
    toast.error("Failed to update screens.");
    return;
  }

  const updateTraceRes = await updateTrace(trace.id, {
    description: data.description,
  });

  if (updateTraceRes.ok === false || updateTraceRes.data === null) {
    toast.error("Failed to update trace.");
    return;
  }

  toast.success("Trace updated successfully.");
}
