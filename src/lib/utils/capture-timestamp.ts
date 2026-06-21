export function formatCaptureTimestampFromObjectId(captureId: string) {
  if (!/^[a-f\d]{24}$/i.test(captureId)) {
    return null;
  }

  const seconds = Number.parseInt(captureId.slice(0, 8), 16);
  if (!Number.isFinite(seconds)) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(seconds * 1000));
}
