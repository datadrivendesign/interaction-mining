export enum Environment {
  LOCAL = "local", // no use case yet, but keeping in case useful
  DEV = "dev", // no use case yet, but keeping in case useful
  PROD = "prod", // only use for temp purpose for now
}

export const getEnvironment = (): Environment => {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
  if (!env) {
    console.warn("NEXT_PUBLIC_ENVIRONMENT is not set, defaulting to DEV");
    return Environment.DEV;
  }
  return env as Environment;
};

export const isProduction = (): boolean => {
  return getEnvironment().toLowerCase() === Environment.PROD;
};

export const isDevelopment = (): boolean => {
  return getEnvironment().toLowerCase() === Environment.DEV;
};

export const isLocal = (): boolean => {
  return getEnvironment().toLowerCase() === Environment.LOCAL;
};
