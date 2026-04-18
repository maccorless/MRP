"use client";

import { useEffect, useState, useTransition } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryDisplayLabel } from "@/lib/category";
import {
  dismissDuplicatePair,
  rejectApplicationInline,
  returnApplicationInline,
} from "@/app/admin/noc/actions";
import type { DuplicateSignal } from "@/lib/anomaly-detect";
import { ORG_TYPE_LABEL } from "@/lib/labels";

const SIGNAL_LABELS: Record<DuplicateSignal, string> = {
  email_domain: "same email domain",
  contact_email: "same contact email",
  website_domain: "same website",
  org_name: "same organisation name & country",
};

const SIGNAL_FIELD: Record<DuplicateSignal, string> = {
  email_domain: "Email domain",
  contact_email: "Contact email",
  website_domain: "Website",
  org_name: "Org name",
};

type AppStatus = "pending" | "resubmitted" | "approved" | "returned" | "rejected";

type AppData = {
  app: Record<string, unknown> & {
    id: string;
    referenceNumber: string;
    status: AppStatus;
    categoryE: boolean;
    categoryEs: boolean;
    categoryEp: boolean;
    categoryEps: boolean;
    categoryEt: boolean;
    categoryEc: boolean;
    contactFirstName?: string | null;
    contactLastName?: string | null;
    contactName?: string | null;
    contactEmail: string;
  };
  org: Record<string, unknown> & {
    name: string;
    orgType: string;
    country: string | null;
    nocCode: string;
    emailDomain?: string | null;
    website?: string | null;
  };
};

type InlineAction = { type: "reject" | "return"; note: string } | null;

function CompareField({
  label,
  value1,
  value2,
  highlighted,
}: {
  label: string;
  value1: string | null | undefined;
  value2: string | null | undefined;
  highlighted?: boolean;
}) {
  return (
    <tr className={highlighted ? "bg-green-50" : undefined}>
      <td className="px-3 py-2 text-xs font-medium whitespace-nowrap border-r border-gray-100 w-28">
        <span className={highlighted ? "text-green-700" : "text-gray-500"}>{label}</span>
        {highlighted && <span className="ml-1 text-green-500 text-[10px]">●</span>}
      </td>
      <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-100">
        {value1 ?? <span className="text-gray-400 italic">—</span>}
      </td>
      <td className="px-3 py-2 text-sm text-gray-900">
        {value2 ?? <span className="text-gray-400 italic">—</span>}
      </td>
    </tr>
  );
}

function AppActionPanel({
  appRef,
  appId,
  effectiveStatus,
  action,
  isPending,
  actionError,
  onSelectAction,
  onNoteChange,
  onConfirm,
  onCancelAction,
  onReview,
}: {
  appRef: string;
  appId: string;
  effectiveStatus: AppStatus;
  action: InlineAction;
  isPending: boolean;
  actionError: string | null;
  onSelectAction: (type: "reject" | "return") => void;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onCancelAction: () => void;
  onReview: () => void;
}) {
  const canAct = effectiveStatus === "pending" || effectiveStatus === "resubmitted";

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-mono font-medium text-gray-600">{appRef}</div>

      {!canAct && (
        <StatusBadge status={effectiveStatus} />
      )}

      {canAct && !action && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onSelectAction("reject")}
            className="w-full px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 rounded hover:bg-red-50 transition-colors cursor-pointer"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => onSelectAction("return")}
            className="w-full px-3 py-1.5 text-xs font-medium text-orange-700 border border-orange-200 rounded hover:bg-orange-50 transition-colors cursor-pointer"
          >
            Return for correction
          </button>
        </div>
      )}

      {canAct && action && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-600 font-medium">
            {action.type === "reject" ? "Rejection" : "Return"} note <span className="text-red-500">*</span>
          </label>
          <textarea
            value={action.note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={3}
            placeholder="Required — visible to the applicant"
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          {actionError && (
            <p className="text-xs text-red-600">{actionError}</p>
          )}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending || !action.note.trim()}
              className={`flex-1 px-3 py-1.5 text-xs font-semibold text-white rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                action.type === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {isPending ? "Saving…" : action.type === "reject" ? "Confirm reject" : "Confirm return"}
            </button>
            <button
              type="button"
              onClick={onCancelAction}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onReview}
        className="w-full px-3 py-1.5 text-xs font-medium text-[#0057A8] border border-[#0057A8] rounded hover:bg-blue-50 transition-colors cursor-pointer"
      >
        Review {appRef} →
      </button>
    </div>
  );
}

export function DuplicateCompareModal({
  appId1,
  appId2,
  orgId1,
  orgId2,
  signals,
  onClose,
  onReviewApp1,
  onReviewApp2,
  onResolved,
}: {
  appId1: string;
  appId2: string;
  orgId1: string;
  orgId2: string;
  signals: DuplicateSignal[];
  onClose: () => void;
  onReviewApp1: () => void;
  onReviewApp2: () => void;
  onResolved: () => void;
}) {
  const [data1, setData1] = useState<AppData | null>(null);
  const [data2, setData2] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline action state — per app
  const [action1, setAction1] = useState<InlineAction>(null);
  const [action2, setAction2] = useState<InlineAction>(null);
  const [actionError1, setActionError1] = useState<string | null>(null);
  const [actionError2, setActionError2] = useState<string | null>(null);
  const [isPending1, startTransition1] = useTransition();
  const [isPending2, startTransition2] = useTransition();
  const [status1Override, setStatus1Override] = useState<AppStatus | null>(null);
  const [status2Override, setStatus2Override] = useState<AppStatus | null>(null);

  const [isDismissPending, startDismissTransition] = useTransition();

  const highlightedFields = new Set(signals.map((s) => SIGNAL_FIELD[s]));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData1(null);
    setData2(null);

    Promise.all([
      fetch(`/api/admin/noc/application/${appId1}`).then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load app ${appId1} (${res.status})`);
        return (await res.json()) as AppData;
      }),
      fetch(`/api/admin/noc/application/${appId2}`).then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load app ${appId2} (${res.status})`);
        return (await res.json()) as AppData;
      }),
    ])
      .then(([d1, d2]) => {
        if (!cancelled) {
          setData1(d1);
          setData2(d2);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [appId1, appId2]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const app1 = data1?.app;
  const org1 = data1?.org;
  const app2 = data2?.app;
  const org2 = data2?.org;

  const effectiveStatus1 = status1Override ?? app1?.status ?? "pending";
  const effectiveStatus2 = status2Override ?? app2?.status ?? "pending";

  function handleConfirmAction(
    appId: string,
    action: InlineAction,
    startTransition: typeof startTransition1,
    setStatusOverride: typeof setStatus1Override,
    setAction: typeof setAction1,
    setActionError: typeof setActionError1,
  ) {
    if (!action?.note.trim()) return;
    startTransition(async () => {
      setActionError(null);
      const result = action.type === "reject"
        ? await rejectApplicationInline(appId, action.note)
        : await returnApplicationInline(appId, action.note);
      if (result.error) {
        setActionError(result.error);
      } else {
        setStatusOverride(action.type === "reject" ? "rejected" : "returned");
        setAction(null);
        onResolved();
      }
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" aria-hidden="true" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
            <h2 id="compare-modal-title" className="font-semibold text-gray-900">
              ⚠ Possible Duplicate
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-5">
            {loading && (
              <div className="py-12 text-center text-sm text-gray-400">Loading applications…</div>
            )}

            {error && !loading && (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && data1 && data2 && app1 && org1 && app2 && org2 && (
              <>
                {/* Signal banner */}
                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  <span className="font-medium">Flagged: </span>
                  {signals.map((s) => SIGNAL_LABELS[s]).join(" · ")}
                </div>

                {/* Comparison table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-r border-gray-100 w-28" />
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-r border-gray-100">
                          {app1.referenceNumber}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                          {app2.referenceNumber}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-3 py-2 text-xs text-gray-500 font-medium border-r border-gray-100">
                          Status
                        </td>
                        <td className="px-3 py-2 border-r border-gray-100">
                          <StatusBadge status={effectiveStatus1} />
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={effectiveStatus2} />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-xs text-gray-500 font-medium border-r border-gray-100">
                          Categories
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-100">
                          {categoryDisplayLabel(
                            app1.categoryE, app1.categoryEs, app1.categoryEp,
                            app1.categoryEps, app1.categoryEt, app1.categoryEc,
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {categoryDisplayLabel(
                            app2.categoryE, app2.categoryEs, app2.categoryEp,
                            app2.categoryEps, app2.categoryEt, app2.categoryEc,
                          )}
                        </td>
                      </tr>
                      <CompareField
                        label="Org name"
                        value1={org1.name}
                        value2={org2.name}
                        highlighted={highlightedFields.has("Org name")}
                      />
                      <CompareField
                        label="Org type"
                        value1={ORG_TYPE_LABEL[org1.orgType] ?? org1.orgType}
                        value2={ORG_TYPE_LABEL[org2.orgType] ?? org2.orgType}
                      />
                      <CompareField
                        label="Country"
                        value1={org1.country}
                        value2={org2.country}
                      />
                      <CompareField
                        label="Website"
                        value1={org1.website as string | null | undefined}
                        value2={org2.website as string | null | undefined}
                        highlighted={highlightedFields.has("Website")}
                      />
                      <CompareField
                        label="Contact name"
                        value1={
                          app1.contactFirstName && app1.contactLastName
                            ? `${app1.contactFirstName} ${app1.contactLastName}`
                            : (app1.contactName as string | null)
                        }
                        value2={
                          app2.contactFirstName && app2.contactLastName
                            ? `${app2.contactFirstName} ${app2.contactLastName}`
                            : (app2.contactName as string | null)
                        }
                      />
                      <CompareField
                        label="Contact email"
                        value1={app1.contactEmail}
                        value2={app2.contactEmail}
                        highlighted={highlightedFields.has("Contact email")}
                      />
                      <CompareField
                        label="Email domain"
                        value1={org1.emailDomain as string | null | undefined}
                        value2={org2.emailDomain as string | null | undefined}
                        highlighted={highlightedFields.has("Email domain")}
                      />
                    </tbody>
                  </table>
                </div>

                {/* Per-app action panels */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <AppActionPanel
                    appRef={app1.referenceNumber}
                    appId={app1.id}
                    effectiveStatus={effectiveStatus1}
                    action={action1}
                    isPending={isPending1}
                    actionError={actionError1}
                    onSelectAction={(type) => { setAction1({ type, note: "" }); setActionError1(null); }}
                    onNoteChange={(note) => setAction1((a) => a ? { ...a, note } : null)}
                    onConfirm={() =>
                      handleConfirmAction(app1.id, action1, startTransition1, setStatus1Override, setAction1, setActionError1)
                    }
                    onCancelAction={() => { setAction1(null); setActionError1(null); }}
                    onReview={() => { onClose(); onReviewApp1(); }}
                  />
                  <AppActionPanel
                    appRef={app2.referenceNumber}
                    appId={app2.id}
                    effectiveStatus={effectiveStatus2}
                    action={action2}
                    isPending={isPending2}
                    actionError={actionError2}
                    onSelectAction={(type) => { setAction2({ type, note: "" }); setActionError2(null); }}
                    onNoteChange={(note) => setAction2((a) => a ? { ...a, note } : null)}
                    onConfirm={() =>
                      handleConfirmAction(app2.id, action2, startTransition2, setStatus2Override, setAction2, setActionError2)
                    }
                    onCancelAction={() => { setAction2(null); setActionError2(null); }}
                    onReview={() => { onClose(); onReviewApp2(); }}
                  />
                </div>

                {/* Dismiss pair */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    disabled={isDismissPending}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      startDismissTransition(async () => {
                        await dismissDuplicatePair(orgId1, orgId2);
                        onClose();
                        onResolved();
                      });
                    }}
                  >
                    {isDismissPending ? "Resolving…" : "Resolve as not duplicate"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
