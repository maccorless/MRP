import { NextRequest } from "next/server";
import { buildContextFromApiKey } from "@/lib/agent/context";
import {
  getQueueSummary,
  listEois,
  getEoi,
  getQuotaSummary,
  getPbnSummary,
  getEnrStatus,
  listOrgs,
  getAuditLog,
} from "@/lib/agent/queries";
import { approveEoi, returnEoi, rejectEoi } from "@/lib/agent/commands";

function extractBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  const rawKey = extractBearerToken(req);
  if (!rawKey) {
    return Response.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  const ctx = await buildContextFromApiKey(rawKey);
  if (!ctx) {
    return Response.json({ error: "Invalid or expired API key" }, { status: 401 });
  }

  const { tool } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    switch (tool) {
      case "get_queue_summary": {
        const data = await getQueueSummary(ctx, body.nocCode);
        return Response.json(data);
      }

      case "list_eois": {
        const data = await listEois(ctx, body);
        return Response.json(data);
      }

      case "get_eoi": {
        if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
        const data = await getEoi(ctx, body.id);
        if (!data) return Response.json({ error: "Application not found" }, { status: 404 });
        return Response.json(data);
      }

      case "get_quota_summary": {
        const data = await getQuotaSummary(ctx, body.nocCode);
        return Response.json(data);
      }

      case "get_pbn_summary": {
        const data = await getPbnSummary(ctx, body.nocCode);
        return Response.json(data);
      }

      case "get_enr_status": {
        const data = await getEnrStatus(ctx, body.nocCode);
        return Response.json(data);
      }

      case "list_orgs": {
        const data = await listOrgs(ctx, body);
        return Response.json(data);
      }

      case "get_audit_log": {
        const data = await getAuditLog(ctx, {
          ...body,
          fromDate: body.fromDate ? new Date(body.fromDate) : undefined,
          toDate: body.toDate ? new Date(body.toDate) : undefined,
        });
        return Response.json(data);
      }

      case "approve_eoi": {
        if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
        const result = await approveEoi(ctx, body.id, body.overrideFlags ? { overrideFlags: true } : undefined);
        if (result.error) return Response.json(result, { status: 422 });
        return Response.json({ success: true });
      }

      case "return_eoi": {
        if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
        if (!body.note) return Response.json({ error: "note is required" }, { status: 400 });
        const result = await returnEoi(ctx, body.id, body.note);
        if (result.error) return Response.json(result, { status: 422 });
        return Response.json({ success: true });
      }

      case "reject_eoi": {
        if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
        if (!body.note) return Response.json({ error: "note is required" }, { status: 400 });
        const result = await rejectEoi(ctx, body.id, body.note);
        if (result.error) return Response.json(result, { status: 422 });
        return Response.json({ success: true });
      }

      default:
        return Response.json({ error: `Unknown tool: ${tool}` }, { status: 404 });
    }
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
