"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categoryDisplayLabel } from "@/lib/category";
import { StatusBadge } from "@/components/StatusBadge";
import { ApplicationDrawer } from "./ApplicationDrawer";
import { DuplicateCompareModal } from "./DuplicateCompareModal";

type Row = {
  id: string;
  organizationId: string;
  referenceNumber: string;
  status: "pending" | "resubmitted" | "approved" | "returned" | "rejected";
  entrySource: string | null;
  categoryE: boolean;
  categoryEs: boolean;
  categoryEp: boolean;
  categoryEps: boolean;
  categoryEt: boolean;
  categoryEc: boolean;
  contactName: string | null;
  submittedAt: Date | string;
  orgName: string;
};

export function QueueClient({
  rows,
  allIds,
  duplicateOrgIds = [],
  duplicatePairs = {},
  orgIdToAppId = {},
}: {
  rows: Row[];
  allIds: string[];
  duplicateOrgIds?: string[];
  duplicatePairs?: Record<string, string[]>;
  orgIdToAppId?: Record<string, string>;
}) {
  const duplicateSet = new Set(duplicateOrgIds);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareTarget, setCompareTarget] = useState<{ appId1: string; appId2: string; orgId1: string; orgId2: string } | null>(null);

  return (
    <>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
              Reference
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
              Organization
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
              Category
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
              Status
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
              Submitted
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-gray-700">
                {row.referenceNumber}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="font-medium text-gray-900 hover:text-[#0057A8] hover:underline text-left cursor-pointer"
                    onClick={() => setSelectedId(row.id)}
                  >
                    {row.orgName}
                  </button>
                  {row.entrySource === "noc_direct" && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                      Direct Entry
                    </span>
                  )}
                  {row.entrySource === "invited" && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      Invited
                    </span>
                  )}
                  {duplicateSet.has(row.organizationId) && (() => {
                    const peerOrgIds = duplicatePairs[row.organizationId] ?? [];
                    const peerOrgId = peerOrgIds[0];
                    const peerAppId = peerOrgId ? orgIdToAppId[peerOrgId] : undefined;
                    return peerAppId && peerOrgId ? (
                      <button
                        type="button"
                        className="px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200 underline decoration-dotted transition-colors"
                        onClick={() => setCompareTarget({ appId1: row.id, appId2: peerAppId, orgId1: row.organizationId, orgId2: peerOrgId })}
                      >
                        ⚠ Possible duplicate
                      </button>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠ Possible duplicate
                      </span>
                    );
                  })()}
                </div>
                <div className="text-xs text-gray-400">{row.contactName}</div>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {categoryDisplayLabel(
                  row.categoryE,
                  row.categoryEs,
                  row.categoryEp,
                  row.categoryEps,
                  row.categoryEt,
                  row.categoryEc,
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {new Date(row.submittedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  className="text-[#0057A8] text-xs font-medium hover:underline cursor-pointer"
                  onClick={() => setSelectedId(row.id)}
                >
                  Review →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedId && (
        <ApplicationDrawer
          appId={selectedId}
          allIds={allIds}
          onClose={() => setSelectedId(null)}
          onNavigate={(newId) => setSelectedId(newId)}
        />
      )}

      {compareTarget && (
        <DuplicateCompareModal
          appId1={compareTarget.appId1}
          appId2={compareTarget.appId2}
          orgId1={compareTarget.orgId1}
          orgId2={compareTarget.orgId2}
          onClose={() => setCompareTarget(null)}
          onReviewApp1={() => setSelectedId(compareTarget.appId1)}
          onReviewApp2={() => setSelectedId(compareTarget.appId2)}
          onResolved={() => router.refresh()}
        />
      )}
    </>
  );
}
