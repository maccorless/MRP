import buildSha from "@/generated/build-sha.json";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    sha: buildSha.sha || null,
  });
}
