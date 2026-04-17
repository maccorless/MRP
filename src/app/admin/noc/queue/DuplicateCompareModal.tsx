"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryDisplayLabel } from "@/lib/category";

const ORG_TYPE_LABEL: Record<string, string> = {
  media_print_online: "Print / Online Media",
  media_broadcast: "Broadcast",
  news_agency: "News Agency",
  freelancer: "Freelancer / Independent",
  enr: "ENR (Non-Rights Broadcaster)",
  other: "Other",
};

type AppData = {
  app: Record<string, unknown> & {
    id: string;
    referenceNumber: string;
    status: "pending" | "resubmitted" | "approved" | "returned" | "rejected";
  };
  org: Record<string, unknown> & {
    name: string;
    orgType: string;
    country: string;
    nocCode: string;
  };
};

function CompareField({
  label,
  value1,
  value2,
}: {
  label: string;
  value1: string | null | undefined;
  value2: string | null | undefined;
}) {
  const differs = value1 !== value2;
  return (
    <tr className={differs ? "bg-yellow-50" : undefined}>
      <td className="px-3 py-2 text-xs text-gray-500 font-medium whitespace-nowrap border-r border-gray-100 w-28">
        {label}
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

export function DuplicateCompareModal({
  appId1,
  appId2,
  onClose,
  onReviewApp1,
  onReviewApp2,
}: {
  appId1: string;
  appId2: string;
  onClose: () => void;
  onReviewApp1: () => void;
  onReviewApp2: () => void;
}) {
  const [data1, setData1] = useState<AppData | null>(null);
  const [data2, setData2] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    return () => {
      cancelled = true;
    };
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

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        aria-hidden="true"
        onClick={onClose}
      />
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
              <div className="py-12 text-center text-sm text-gray-400">
                Loading applications…
              </div>
            )}

            {error && !loading && (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && data1 && data2 && app1 && org1 && app2 && org2 && (
              <>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-r border-gray-100 w-28" />
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-r border-gray-100">
                          {app1.referenceNumber as string}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                          {app2.referenceNumber as string}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-3 py-2 text-xs text-gray-500 font-medium border-r border-gray-100">
                          Status
                        </td>
                        <td className="px-3 py-2 border-r border-gray-100">
                          <StatusBadge status={app1.status} />
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={app2.status} />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-xs text-gray-500 font-medium border-r border-gray-100">
                          Categories
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-100">
                          {categoryDisplayLabel(
                            app1.categoryE as boolean,
                            app1.categoryEs as boolean,
                            app1.categoryEp as boolean,
                            app1.categoryEps as boolean,
                            app1.categoryEt as boolean,
                            app1.categoryEc as boolean,
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {categoryDisplayLabel(
                            app2.categoryE as boolean,
                            app2.categoryEs as boolean,
                            app2.categoryEp as boolean,
                            app2.categoryEps as boolean,
                            app2.categoryEt as boolean,
                            app2.categoryEc as boolean,
                          )}
                        </td>
                      </tr>
                      <CompareField
                        label="Org name"
                        value1={org1.name}
                        value2={org2.name}
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
                        value1={app1.contactEmail as string | null}
                        value2={app2.contactEmail as string | null}
                      />
                      <CompareField
                        label="Email domain"
                        value1={org1.emailDomain as string | null}
                        value2={org2.emailDomain as string | null}
                      />
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-[#0057A8] text-white text-sm font-medium rounded hover:bg-[#004a8f] transition-colors cursor-pointer"
                    onClick={() => {
                      onClose();
                      onReviewApp1();
                    }}
                  >
                    Review {app1.referenceNumber as string} →
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-[#0057A8] text-white text-sm font-medium rounded hover:bg-[#004a8f] transition-colors cursor-pointer"
                    onClick={() => {
                      onClose();
                      onReviewApp2();
                    }}
                  >
                    Review {app2.referenceNumber as string} →
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
