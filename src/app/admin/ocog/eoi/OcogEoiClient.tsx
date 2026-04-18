"use client";

import { useState } from "react";
import Link from "next/link";

interface NocRow {
  nocCode: string;
  pending: number;
  candidate: number;
  returned: number;
  rejected: number;
  total: number;
}

interface Totals {
  pending: number;
  candidate: number;
  returned: number;
  rejected: number;
  total: number;
}

export function OcogEoiClient({
  rows,
  totals,
}: {
  rows: NocRow[];
  totals: Totals;
}) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? rows.filter((r) => r.nocCode.toLowerCase().includes(search.trim().toLowerCase()))
    : rows;

  return (
    <>
      {/* Search input */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by NOC code…"
          className="w-full sm:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          aria-label="Filter NOC rows by code"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No applications have been submitted yet.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No NOCs match &ldquo;{search}&rdquo;.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  NOC
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pending
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Candidate
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Returned
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Rejected
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr
                  key={row.nocCode}
                  className={`transition-colors ${
                    row.candidate === 0
                      ? "bg-amber-50 hover:bg-amber-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">
                    <Link
                      href={`/admin/ocog/eoi/${row.nocCode}`}
                      className="hover:text-brand-blue hover:underline"
                    >
                      {row.nocCode}
                    </Link>
                    {row.candidate === 0 && row.total > 0 && (
                      <span className="ml-2 text-xs font-sans font-normal text-amber-600">
                        no candidates
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {row.pending > 0 ? (
                      <span className="font-medium text-yellow-700">{row.pending}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {row.candidate > 0 ? (
                      <span className="font-medium text-green-700">{row.candidate}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {row.returned > 0 ? row.returned : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {row.rejected > 0 ? row.rejected : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
            {!search && (
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total ({rows.length} NOCs)
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-yellow-700">
                    {totals.pending || <span className="text-gray-400">0</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-green-700">
                    {totals.candidate || <span className="text-gray-400">0</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-700">
                    {totals.returned || <span className="text-gray-400">0</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-700">
                    {totals.rejected || <span className="text-gray-400">0</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">
                    {totals.total}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </>
  );
}
