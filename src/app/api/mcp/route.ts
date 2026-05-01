import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { buildContextFromApiKey } from "@/lib/agent/context";
import { extractBearerToken } from "@/lib/agent/auth";
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

export async function POST(req: Request): Promise<Response> {
  const rawKey = extractBearerToken(req);
  if (!rawKey) {
    return Response.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  const ctx = await buildContextFromApiKey(rawKey);
  if (!ctx) {
    return Response.json({ error: "Invalid or expired API key" }, { status: 401 });
  }

  const server = new McpServer({ name: "prp", version: "1.0.0" });

  // ─── Read tools ──────────────────────────────────────────────────────────────

  server.registerTool("get_queue_summary", {
    description:
      "Returns EoI counts grouped by status for the authenticated NOC admin's NOC. " +
      "Use for: how many are in my queue, pipeline breakdown, how many are pending/approved/rejected.",
    inputSchema: z.object({
      nocCode: z.string().optional().describe("NOC code to query (IOC admins only; NOC admins always see their own NOC)"),
    }),
  }, async ({ nocCode }) => {
    const result = await getQueueSummary(ctx, nocCode);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("list_eois", {
    description:
      "Lists applications with optional filters. NOC admins are automatically scoped to their own NOC. " +
      "Paginated — default 50 results, max 200. " +
      "Use for: browsing the queue, finding specific organizations, reviewing by status.",
    inputSchema: z.object({
      status: z.string().optional().describe("Filter by status: pending, resubmitted, approved, returned, rejected"),
      nocCode: z.string().optional().describe("NOC code filter (IOC admins only)"),
      orgName: z.string().optional().describe("Partial org name search"),
      limit: z.number().int().min(1).max(200).optional().describe("Results per page (default 50)"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
    }),
  }, async (filters) => {
    const result = await listEois(ctx, filters);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_eoi", {
    description:
      "Returns full detail on a single application: organization info, quota, slot allocations, and recent audit history. " +
      "Use for: reviewing a specific EOI before taking action, checking reviewer notes.",
    inputSchema: z.object({
      id: z.string().describe("Application ID (UUID)"),
    }),
  }, async ({ id }) => {
    const result = await getEoi(ctx, id);
    if (!result) return { content: [{ type: "text", text: "Application not found." }] };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_quota_summary", {
    description:
      "Returns quota utilization per credential category — allocated vs. total with utilization percentage. " +
      "Use for: quota projection questions, how many slots do we have left, are we on track.",
    inputSchema: z.object({
      nocCode: z.string().optional().describe("NOC code (IOC admins only; NOC admins always see their own NOC)"),
    }),
  }, async ({ nocCode }) => {
    const result = await getQuotaSummary(ctx, nocCode);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_pbn_summary", {
    description:
      "Returns PbN (Pass by Name) allocation state per organization for a NOC. " +
      "Use for: how are we distributing slots, which orgs have submitted their PbN allocations.",
    inputSchema: z.object({
      nocCode: z.string().optional().describe("NOC code (IOC admins only)"),
    }),
  }, async ({ nocCode }) => {
    const result = await getPbnSummary(ctx, nocCode);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_enr_status", {
    description:
      "Returns ENR (Enhanced National Rights) request rankings and grant decisions for a NOC. " +
      "Use for: ENR prioritization questions, who has been ranked, which grants are pending.",
    inputSchema: z.object({
      nocCode: z.string().optional().describe("NOC code (IOC admins only)"),
    }),
  }, async ({ nocCode }) => {
    const result = await getEnrStatus(ctx, nocCode);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("list_orgs", {
    description:
      "Lists organizations with optional filters. Default 50 results, max 200. " +
      "Use for: finding organizations by type or country, browsing your NOC's registered organizations.",
    inputSchema: z.object({
      nocCode: z.string().optional().describe("NOC code filter (IOC admins only)"),
      orgType: z.string().optional().describe("Organization type filter"),
      country: z.string().optional().describe("Country filter"),
      status: z.string().optional().describe("Organization status filter"),
      limit: z.number().int().min(1).max(200).optional(),
      offset: z.number().int().min(0).optional(),
    }),
  }, async (filters) => {
    const result = await listOrgs(ctx, filters);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_audit_log", {
    description:
      "Returns recent audit events. NOC admins are scoped to their own NOC's applications. " +
      "Use for: reviewing recent actions, checking who approved or returned an application.",
    inputSchema: z.object({
      actorId: z.string().optional().describe("Filter by actor user ID"),
      action: z.string().optional().describe("Filter by action type (e.g. application_approved, application_rejected)"),
      applicationId: z.string().optional().describe("Filter by application ID"),
      fromDate: z.string().optional().describe("ISO 8601 start date filter"),
      toDate: z.string().optional().describe("ISO 8601 end date filter"),
      limit: z.number().int().min(1).max(200).optional(),
      offset: z.number().int().min(0).optional(),
    }),
  }, async ({ fromDate, toDate, ...rest }) => {
    const result = await getAuditLog(ctx, {
      ...rest,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  // ─── Write tools ─────────────────────────────────────────────────────────────

  server.registerTool("approve_eoi", {
    description:
      "Approves an EoI application. NOC admin role required. " +
      "Application must be in 'pending' or 'resubmitted' status. " +
      "If the application has eligibility flags (e.g. government email domain), returns an error with the flag list. " +
      "Re-call with overrideFlags: true to approve despite flags (requires explicit human decision). " +
      "This action is recorded in the audit log as an api_key action.",
    inputSchema: z.object({
      id: z.string().describe("Application ID (UUID)"),
      overrideFlags: z.boolean().optional().describe("Set to true to approve despite eligibility flags (requires acknowledgement)"),
    }),
  }, async ({ id, overrideFlags }) => {
    const result = await approveEoi(ctx, id, overrideFlags ? { overrideFlags: true } : undefined);
    if (result.error) {
      const msg = result.flags
        ? `${result.error} Flags: ${result.flags.join(", ")}. Re-call with overrideFlags: true to proceed.`
        : result.error;
      return { content: [{ type: "text", text: msg }], isError: true };
    }
    return { content: [{ type: "text", text: "Application approved successfully." }] };
  });

  server.registerTool("return_eoi", {
    description:
      "Returns an EoI application to the applicant for corrections. NOC admin role required. " +
      "Application must be in 'pending' or 'resubmitted' status. A note explaining what needs correction is required. " +
      "This action is recorded in the audit log and notifies the applicant.",
    inputSchema: z.object({
      id: z.string().describe("Application ID (UUID)"),
      note: z.string().min(1).describe("Required note explaining what needs to be corrected"),
    }),
  }, async ({ id, note }) => {
    const result = await returnEoi(ctx, id, note);
    if (result.error) return { content: [{ type: "text", text: result.error }], isError: true };
    return { content: [{ type: "text", text: "Application returned to applicant." }] };
  });

  server.registerTool("reject_eoi", {
    description:
      "Rejects an EoI application. NOC admin role required. " +
      "Application must be in 'pending' or 'resubmitted' status. A note explaining the rejection reason is required. " +
      "WARNING: Rejections cannot be self-reversed by the applicant. This action is permanent.",
    inputSchema: z.object({
      id: z.string().describe("Application ID (UUID)"),
      note: z.string().min(1).describe("Required note explaining the rejection reason"),
    }),
  }, async ({ id, note }) => {
    const result = await rejectEoi(ctx, id, note);
    if (result.error) return { content: [{ type: "text", text: result.error }], isError: true };
    return { content: [{ type: "text", text: "Application rejected." }] };
  });

  // ─── Handle request ───────────────────────────────────────────────────────────

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — required for multi-instance Railway deployments
  });

  await server.connect(transport);
  return transport.handleRequest(req);
}

// SSE not supported in stateless mode — return explicit 405 rather than letting
// Next.js silently return 405, so MCP clients get an actionable response.
export function GET() {
  return Response.json(
    { error: "SSE streams are not supported in stateless mode. Use POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export function DELETE() {
  return Response.json(
    { error: "Session termination is not supported in stateless mode." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
