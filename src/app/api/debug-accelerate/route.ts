/**
 * TEMPORARY DIAGNOSTIC — delete once acceleration is confirmed working.
 *
 * The previous variable name (`UPLOAD_ACCELERATE`) matched none of the
 * patterns `amplify.yml` copies into `.env.production`, so it never reached the
 * deployed runtime. This confirms the renamed `_AWS_UPLOAD_ACCELERATE` does.
 *
 * Names and booleans only: no secret values are returned.
 */

// Without this the route can be statically rendered at build time, which would
// report the build environment and answer the wrong question.
export const dynamic = "force-dynamic";

export async function GET() {
  const visibleNames = Object.keys(process.env)
    .filter((k) => k.includes("ACCELERATE") || k.startsWith("_AWS"))
    .sort();

  return Response.json({
    // the renamed variable — this is the answer we are after
    _AWS_UPLOAD_ACCELERATE: process.env._AWS_UPLOAD_ACCELERATE ?? null,

    // the old name, to prove the rename is what fixed it
    UPLOAD_ACCELERATE_old: process.env.UPLOAD_ACCELERATE ?? null,

    // what the signing code decides, computed the same way
    wouldAccelerate:
      process.env._AWS_UPLOAD_ACCELERATE === "true" &&
      process.env.USE_MINIO_STORE !== "true",

    // control: known-good variables that already match an amplify.yml pattern
    hasUploadBucket: Boolean(process.env._AWS_UPLOAD_BUCKET),
    hasRegion: Boolean(process.env._AWS_REGION),

    visibleNames,
    totalEnvVars: Object.keys(process.env).length,
  });
}
