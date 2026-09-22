/**
 * TEMPORARY DIAGNOSTIC — delete once the acceleration question is settled.
 *
 * Reports whether the SSR runtime can see UPLOAD_ACCELERATE, to distinguish
 * "the code does not read it correctly" from "the host never provides it".
 * Names and booleans only: no secret values are returned.
 */

// Without this the route can be statically rendered at build time, which would
// report the *build* environment and answer the wrong question entirely.
export const dynamic = "force-dynamic";

export async function GET() {
  const visibleNames = Object.keys(process.env)
    .filter(
      (k) =>
        k.startsWith("UPLOAD") ||
        k.startsWith("_AWS") ||
        k === "USE_MINIO_STORE",
    )
    .sort();

  return Response.json({
    // the value we actually care about — not a secret
    UPLOAD_ACCELERATE: process.env.UPLOAD_ACCELERATE ?? null,
    USE_MINIO_STORE: process.env.USE_MINIO_STORE ?? null,

    // what the signing code would decide, computed the same way
    wouldAccelerate:
      process.env.UPLOAD_ACCELERATE === "true" &&
      process.env.USE_MINIO_STORE !== "true",

    // presence only, as a control: these demonstrably work at runtime
    hasUploadBucket: Boolean(process.env._AWS_UPLOAD_BUCKET),
    hasRegion: Boolean(process.env._AWS_REGION),
    hasAccessKeyId: Boolean(process.env._AWS_ACCESS_KEY_ID),

    // if UPLOAD_ACCELERATE is missing here but _AWS_* are present, the host is
    // filtering which variables reach the runtime
    visibleNames,
    totalEnvVars: Object.keys(process.env).length,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
