export function googleImageAdapter(url: string, res: number = 256) {
  if (!url) {
    return "";
  }
  const cleanedUrl = url.split("=s")[0];
  return `${cleanedUrl}=s${res}-c`;
}
