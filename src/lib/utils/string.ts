export const prettyOS = (os: string) => {
  // case insensitive
  const osLower = os.toLowerCase();

  switch (osLower) {
    case "ios":
      return "iOS";
    case "android":
      return "Android";
    case "web":
      return "Web";
    default:
      return "Unknown Platform";
  }
};
