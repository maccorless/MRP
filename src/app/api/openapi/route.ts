import { createDocument } from "zod-openapi";
import { z } from "zod";

// Shared input schemas (mirror the MCP tool schemas)
const NocCodeParam = z.object({
  nocCode: z.string().optional().meta({ description: "NOC code (IOC admins only; NOC admins always see their own NOC)" }),
});

const PaginationParams = z.object({
  limit: z.number().int().min(1).max(200).optional().meta({ description: "Results per page (default 50, max 200)" }),
  offset: z.number().int().min(0).optional().meta({ description: "Pagination offset" }),
});

const ErrorResponse = z.object({
  error: z.string(),
  flags: z.array(z.string()).optional().meta({ description: "Eligibility flags blocking the action (approve_eoi only)" }),
});

const successResponse = {
  "200": { description: "Success", content: { "application/json": { schema: z.object({}) } } },
};

const errorResponse = {
  "401": { description: "Unauthorized — missing or invalid API key" },
  "422": { description: "Action not permitted", content: { "application/json": { schema: ErrorResponse } } },
};

function toolPath(description: string, inputSchema: z.ZodType, responseSchema?: z.ZodType) {
  return {
    post: {
      description,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: inputSchema } },
      },
      responses: {
        "200": {
          description: "Success",
          content: { "application/json": { schema: responseSchema ?? z.object({}).passthrough() } },
        },
        ...errorResponse,
      },
    },
  };
}

const spec = createDocument({
  openapi: "3.1.0",
  info: {
    title: "PRP Agent API",
    version: "1.0.0",
    description:
      "Programmatic interface for the LA 2028 Press Registration Portal. " +
      "All endpoints require a Bearer API key. NOC admins are automatically scoped to their own NOC.",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key issued by portal administrators. Format: prp_<hex>",
      },
    },
  },
  paths: {
    "/api/agent/get_queue_summary": toolPath(
      "Returns EoI counts grouped by status. Use for: how many are in my queue, pipeline breakdown.",
      NocCodeParam,
    ),

    "/api/agent/list_eois": toolPath(
      "Lists applications with optional filters. Paginated (default 50, max 200). NOC admins scoped to their own NOC.",
      z.object({
        status: z.string().optional().meta({ description: "Filter by status: pending, resubmitted, approved, returned, rejected" }),
        nocCode: z.string().optional(),
        orgName: z.string().optional().meta({ description: "Partial org name search" }),
        ...PaginationParams.shape,
      }),
    ),

    "/api/agent/get_eoi": toolPath(
      "Returns full detail on one application: org info, quota, slot allocations, and recent audit history.",
      z.object({ id: z.string().meta({ description: "Application ID (UUID)" }) }),
    ),

    "/api/agent/get_quota_summary": toolPath(
      "Returns quota utilization per credential category — allocated vs. total with utilization percentage.",
      NocCodeParam,
    ),

    "/api/agent/get_pbn_summary": toolPath(
      "Returns PbN allocation state per organization for a NOC.",
      NocCodeParam,
    ),

    "/api/agent/get_enr_status": toolPath(
      "Returns ENR request rankings and grant decisions for a NOC.",
      NocCodeParam,
    ),

    "/api/agent/list_orgs": toolPath(
      "Lists organizations with optional filters. Paginated (default 50, max 200).",
      z.object({
        nocCode: z.string().optional(),
        orgType: z.string().optional(),
        country: z.string().optional(),
        status: z.string().optional(),
        ...PaginationParams.shape,
      }),
    ),

    "/api/agent/get_audit_log": toolPath(
      "Returns recent audit events. NOC admins scoped to their own NOC's applications.",
      z.object({
        actorId: z.string().optional(),
        action: z.string().optional().meta({ description: "e.g. application_approved, application_rejected" }),
        applicationId: z.string().optional(),
        fromDate: z.string().optional().meta({ description: "ISO 8601 start date" }),
        toDate: z.string().optional().meta({ description: "ISO 8601 end date" }),
        ...PaginationParams.shape,
      }),
    ),

    "/api/agent/approve_eoi": toolPath(
      "Approves an EoI. NOC admin only. Must be pending or resubmitted. " +
      "If eligibility flags exist, returns 422 with flag list. Re-call with overrideFlags: true to proceed.",
      z.object({
        id: z.string().meta({ description: "Application ID (UUID)" }),
        overrideFlags: z.boolean().optional().meta({ description: "Set true to approve despite eligibility flags" }),
      }),
      z.object({ success: z.boolean() }),
    ),

    "/api/agent/return_eoi": toolPath(
      "Returns an EoI to the applicant for corrections. NOC admin only. Note required.",
      z.object({
        id: z.string().meta({ description: "Application ID (UUID)" }),
        note: z.string().min(1).meta({ description: "Explanation of what needs correction" }),
      }),
      z.object({ success: z.boolean() }),
    ),

    "/api/agent/reject_eoi": toolPath(
      "Rejects an EoI. NOC admin only. Note required. WARNING: permanent action — cannot be self-reversed.",
      z.object({
        id: z.string().meta({ description: "Application ID (UUID)" }),
        note: z.string().min(1).meta({ description: "Rejection reason" }),
      }),
      z.object({ success: z.boolean() }),
    ),
  },
});

// Intentionally unauthenticated: ChatGPT Custom GPT Actions and Copilot Extensions
// require the spec to be publicly reachable to configure the integration.
// The spec describes shape only — no data is returned, and all agent endpoints
// require a valid Bearer API key.
export function GET() {
  return Response.json(spec);
}
