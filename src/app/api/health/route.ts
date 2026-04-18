export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    sha: process.env.RAILWAY_GIT_COMMIT_SHA ?? null,
  });
}
