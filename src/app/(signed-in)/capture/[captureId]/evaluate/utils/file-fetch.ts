import { ListedFiles } from "@/lib/actions";
import { generateSignedCloudFrontURL, listFromS3 } from "@/lib/aws/s3/server";

export async function fetchVideoFile(fileKey: string): Promise<ListedFiles[]> {
  let res = await listFromS3(fileKey, false);
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
  const signedUrlRes = await Promise.all(
    videoFiles.map(async (file) => {
      const signedUrlRes = await generateSignedCloudFrontURL(file.fileKey);
      if (signedUrlRes.ok) {
        return { ...file, fileUrl: signedUrlRes.data.signedUrl };
      } else {
        return file;
      }
    }),
  );
  return signedUrlRes;
}
