import { Platform } from "./platform";

export const prettyOS = (os: string) => {
  // case insensitive
  const osLower = os.toLowerCase();

  switch (osLower) {
    case Platform.IOS:
      return "iOS";
    case Platform.ANDROID:
      return "Android";
    case Platform.WEB:
      return "Web";
    default:
      return "Unknown Platform";
  }
};
