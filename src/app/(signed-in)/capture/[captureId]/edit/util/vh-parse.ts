import { Redaction } from "../components/types";

export function computeIoU(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  const xA = Math.max(a.x, b.x);
  const yA = Math.max(a.y, b.y);
  const xB = Math.min(a.x + a.width, b.x + b.width);
  const yB = Math.min(a.y + a.height, b.y + b.height);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const intersection = interWidth * interHeight;

  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const union = areaA + areaB - intersection;

  return union === 0 ? 0 : intersection / union;
}

// recurse through tree and check IoU with all redactions
export function redactVH(
  node: any, // TODO: make some rough types for vh nodes
  redactions: Redaction[],
  imgWidth: number,
  imgHeight: number,
) {
  // check
  if (node.bounds_in_screen) {
    const [left, top, right, bottom] = node.bounds_in_screen
      .split(" ")
      .map(Number);
    const width = right - left;
    const height = bottom - top;
    const x = left;
    const y = top;

    for (const r of redactions) {
      const redactionRect = {
        x: r.x * imgWidth,
        y: r.y * imgHeight,
        width: r.width * imgWidth,
        height: r.height * imgHeight,
      };

      const nodeRect = { x, y, width, height };

      const iou = computeIoU(redactionRect, nodeRect);
      if (iou > 0.1) {
        if ("content-desc" in node && node["content=desc"] !== "none") {
          node["content-desc"] = "REDACTED";
        }
        if ("text_field" in node) {
          node["text_field"] = "REDACTED";
        }
        break; // only redact once
      }
    }
  }
  // recursive case
  if (node.children && node.children.length > 0) {
    node.children.forEach((child: any) =>
      redactVH(child, redactions, imgWidth, imgHeight),
    );
  }
}
