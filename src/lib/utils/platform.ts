export const Platform = {
    IOS: "ios",
    ANDROID: "android",
    WEB: "web",
  };
  
  export type Platform = typeof Platform[keyof typeof Platform];