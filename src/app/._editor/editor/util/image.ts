export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
  
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Convert the result to a Base64 PNG data URI
        const base64data = reader.result as string;
        resolve(`data:image/png;base64,${base64data.split(",")[1]}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }