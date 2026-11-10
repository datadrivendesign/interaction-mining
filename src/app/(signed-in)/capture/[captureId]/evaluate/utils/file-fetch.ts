import { getCaptureFiles, ListedFiles } from "@/lib/actions";

/**
 * Lists a capture's video file(s) with signed URLs. Goes through the checked
 * `getCaptureFiles` action, which verifies the caller may see the capture and
 * signs every object under its prefix.
 */
export async function fetchVideoFile(
  captureId: string,
): Promise<ListedFiles[]> {
  const res = await getCaptureFiles(captureId);
  if (!res.ok) {
    console.error("Failed to fetch uploaded files", res.message);
    return [];
  }
  const regexRule = /\.(mp4|mov)$/;
  const videoFiles = res.data.filter((file) =>
    regexRule.test(file.fileKey.toLowerCase()),
  );
  if (videoFiles.length === 0) {
    console.error("No video file found");
    return [];
  }
  return videoFiles;
}
